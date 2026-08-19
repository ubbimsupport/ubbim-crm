import { NextResponse } from "next/server";
import { emailCopy, sendEmail } from "@/lib/email/send";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { formatMoney } from "@/lib/format";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }
  if (!hasAdminClient()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for webhooks." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  const raw = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const paymentId = session.metadata?.payment_id;
    if (paymentId) {
      await admin.rpc("crm_apply_payment_status", {
        p_payment_id: paymentId,
        p_status: "paid",
        p_stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
        p_receipt_url: session.invoice ? String(session.invoice) : null,
      });
      const { data: payment } = await admin.from("crm_payments").select("*, company:crm_companies(email, company_name)").eq("id", paymentId).maybeSingle();
      if (payment) {
        const userId = session.metadata?.user_id;
        if (userId) {
          await admin.from("crm_notifications").insert({
            user_id: userId,
            type: "payment_successful",
            title: "Payment successful",
            body: `${payment.payment_code} was paid.`,
            link: "/payments",
            entity_type: "payment",
            entity_id: paymentId,
          });
        }
        const email = payment.company?.email;
        if (email) {
          const copy = emailCopy.payment("successful", formatMoney(payment.amount, payment.currency), payment.payment_code);
          await sendEmail({ to: email, ...copy });
        }
      }
    }
  }

  if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
    const session = event.data.object;
    const paymentId = session.metadata?.payment_id;
    if (paymentId) {
      await admin.rpc("crm_apply_payment_status", {
        p_payment_id: paymentId,
        p_status: event.type === "checkout.session.expired" ? "cancelled" : "failed",
      });
      const userId = session.metadata?.user_id;
      if (userId) {
        await admin.from("crm_notifications").insert({
          user_id: userId,
          type: "payment_failed",
          title: "Payment unsuccessful",
          body: "A Stripe checkout session did not complete.",
          link: "/payments",
          entity_type: "payment",
          entity_id: paymentId,
        });
      }
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const intent = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
    if (intent) {
      const { data: payment } = await admin.from("crm_payments").select("id").eq("stripe_payment_intent_id", intent).maybeSingle();
      if (payment) {
        await admin.rpc("crm_apply_payment_status", { p_payment_id: payment.id, p_status: "refunded" });
      }
    }
  }

  return NextResponse.json({ received: true });
}
