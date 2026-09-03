"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Payment } from "@/lib/types";

export function ContractorPayButton({ payment }: { payment: Payment }) {
  const [busy, setBusy] = useState(false);
  if (payment.status !== "pending") return null;

  async function pay() {
    setBusy(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          companyId: payment.company_id,
          amount: payment.amount,
          paymentType: payment.payment_type,
          description: payment.remarks || payment.payment_code,
          portal: "contractor",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to start checkout");
      window.location.href = payload.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" onClick={pay} disabled={busy}>
      {busy ? "Opening Stripe..." : "Pay now"}
    </Button>
  );
}