"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAYMENT_TYPES } from "@/lib/constants";
import type { Company } from "@/lib/types";

export function CheckoutButton({ companies }: { companies: Pick<Company, "id" | "company_name">[] }) {
  const [busy, setBusy] = useState(false);

  async function startCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: form.get("companyId"),
          amount: Number(form.get("amount")),
          paymentType: form.get("paymentType"),
          description: form.get("description"),
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
    <form onSubmit={startCheckout} className="grid gap-2 rounded-xl border bg-card p-4 md:grid-cols-4">
      <select name="companyId" className="h-8 rounded-md border px-3 text-sm" required>
        <option value="">Company</option>
        {companies.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
      </select>
      <select name="paymentType" className="h-8 rounded-md border px-3 text-sm">
        {PAYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <Input name="amount" type="number" min="1" step="0.01" placeholder="Amount (MYR)" required />
      <Input name="description" placeholder="Description" />
      <Button type="submit" disabled={busy}>{busy ? "Starting..." : "Collect payment"}</Button>
    </form>
  );
}
