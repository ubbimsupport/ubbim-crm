import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { PAYMENT_STATUSES, PAYMENT_TYPES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { canViewPayments } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { Company, Payment } from "@/lib/types";
import { redirect } from "next/navigation";
import { CheckoutButton } from "@/components/crm/checkout-button";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; company?: string; from?: string; to?: string }>;
}) {
  const profile = await requireProfile();
  if (!canViewPayments(profile.role)) redirect("/dashboard");
  const query = await searchParams;
  const supabase = await createClient();
  let request = supabase.from("crm_payments").select("*, company:crm_companies(id, company_name, company_code), invoice:crm_invoices(id, invoice_code)").order("created_at", { ascending: false });
  if (query.status) request = request.eq("status", query.status);
  if (query.type) request = request.eq("payment_type", query.type);
  if (query.company) request = request.eq("company_id", query.company);
  if (query.from) request = request.gte("created_at", query.from);
  if (query.to) request = request.lte("created_at", query.to);
  const [{ data }, { data: companies }] = await Promise.all([
    request,
    supabase.from("crm_companies").select("id, company_name, company_code").order("company_name"),
  ]);
  const payments = (data ?? []) as Payment[];
  const paid = payments.filter((p) => p.status === "paid");
  const stats = [
    { label: "Total revenue", value: formatMoney(paid.reduce((s, p) => s + Number(p.amount), 0)) },
    { label: "Pending", value: formatMoney(payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0)) },
    { label: "Successful", value: String(paid.length) },
    { label: "Failed", value: String(payments.filter((p) => p.status === "failed").length) },
    { label: "Refunded", value: String(payments.filter((p) => p.status === "refunded").length) },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Stripe-backed invoices, registration fees, and service payments." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => (
          <Card key={item.label}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle></CardHeader><CardContent className="text-xl font-semibold text-primary">{item.value}</CardContent></Card>
        ))}
      </div>
      <form className="grid gap-2 md:grid-cols-5">
        <select name="company" defaultValue={query.company ?? ""} className="h-8 rounded-md border px-3 text-sm">
          <option value="">All companies</option>
          {(companies as Company[] | null ?? []).map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
        </select>
        <select name="status" defaultValue={query.status ?? ""} className="h-8 rounded-md border px-3 text-sm">
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select name="type" defaultValue={query.type ?? ""} className="h-8 rounded-md border px-3 text-sm">
          <option value="">All types</option>
          {PAYMENT_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input type="date" name="from" defaultValue={query.from} className="h-8 rounded-md border px-3 text-sm" />
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      <CheckoutButton companies={(companies as Company[] | null ?? [])} />
      {payments.length === 0 ? <EmptyState title="No payments" description="Create a Stripe checkout session to record a payment." /> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Stripe</th><th className="px-3 py-2">Date</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{p.payment_code}</td>
                  <td className="px-3 py-2">{p.company?.company_name}</td>
                  <td className="px-3 py-2">{p.payment_type}</td>
                  <td className="px-3 py-2">{formatMoney(p.amount, p.currency)}</td>
                  <td className="px-3 py-2"><StatusBadge value={p.status} /></td>
                  <td className="px-3 py-2 text-xs">{p.stripe_payment_intent_id || p.stripe_checkout_session_id || "—"}</td>
                  <td className="px-3 py-2">{formatDate(p.paid_at || p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
