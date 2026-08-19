import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await requireProfile();
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY." }, { status: 400 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe is not configured." }, { status: 400 });

  const body = await request.json() as {
    companyId?: string;
    amount?: number;
    paymentType?: string;
    description?: string;
  };
  if (!body.companyId || !body.amount || body.amount <= 0) {
    return NextResponse.json({ error: "Company and amount are required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: payment, error } = await supabase.from("crm_payments").insert({
    company_id: body.companyId,
    user_id: profile.id,
    created_by: profile.id,
    payment_type: body.paymentType || "service",
    amount: body.amount,
    currency: "MYR",
    status: "pending",
    remarks: body.description,
    metadata: { company_id: body.companyId, user_id: profile.id },
  }).select("id, payment_code").single();
  if (error || !payment) {
    return NextResponse.json({ error: error?.message || "Unable to create payment" }, { status: 400 });
  }

  const origin = getAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/payments/failed`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "myr",
          unit_amount: Math.round(body.amount * 100),
          product_data: {
            name: body.description || `UBBIM ${body.paymentType || "service"} payment`,
          },
        },
      },
    ],
    metadata: {
      payment_id: payment.id,
      payment_code: payment.payment_code,
      user_id: profile.id,
      company_id: body.companyId,
      invoice: payment.payment_code,
    },
  });

  await supabase.from("crm_payments").update({
    stripe_checkout_session_id: session.id,
  }).eq("id", payment.id);

  return NextResponse.json({ url: session.url });
}
