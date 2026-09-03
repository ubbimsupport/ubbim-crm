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
    paymentId?: string;
    portal?: string;
  };
  if (!body.companyId || !body.amount || body.amount <= 0) {
    return NextResponse.json({ error: "Company and amount are required." }, { status: 400 });
  }

  const supabase = await createClient();
  if (profile.role === "contractor") {
    const { data: own } = await supabase
      .from("crm_profiles")
      .select("company_id")
      .eq("id", profile.id)
      .maybeSingle();
    if (!own?.company_id || own.company_id !== body.companyId) {
      return NextResponse.json({ error: "You can only pay invoices for your own company." }, { status: 403 });
    }
  }

  let payment: { id: string; payment_code: string } | null = null;
  if (body.paymentId) {
    const { data: existing, error: existingError } = await supabase
      .from("crm_payments")
      .select("id, payment_code, company_id, status, amount")
      .eq("id", body.paymentId)
      .maybeSingle();
    if (existingError || !existing) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    }
    if (existing.company_id !== body.companyId) {
      return NextResponse.json({ error: "Payment does not belong to this company." }, { status: 403 });
    }
    if (existing.status !== "pending") {
      return NextResponse.json({ error: "This payment is not awaiting checkout." }, { status: 400 });
    }
    payment = existing;
  } else {
    const { data, error } = await supabase.from("crm_payments").insert({
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
    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Unable to create payment" }, { status: 400 });
    }
    payment = data;
  }
  if (!payment) {
    return NextResponse.json({ error: "Unable to create payment" }, { status: 400 });
  }

  const origin = getAppUrl();
  const contractorPortal = body.portal === "contractor" || profile.role === "contractor";
  const successUrl = contractorPortal
    ? `${origin}/contractor/payments/success?session_id={CHECKOUT_SESSION_ID}`
    : `${origin}/payments/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = contractorPortal ? `${origin}/contractor/payments/failed` : `${origin}/payments/failed`;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
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
      portal: contractorPortal ? "contractor" : "staff",
      invoice: payment.payment_code,
    },
  });

  await supabase.from("crm_payments").update({
    stripe_checkout_session_id: session.id,
  }).eq("id", payment.id);

  return NextResponse.json({ url: session.url });
}
