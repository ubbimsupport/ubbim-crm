import Link from "next/link";
import { ContractorPayButton } from "./pay-button";
import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { getContractorContext } from "@/lib/contractor";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Payment } from "@/lib/types";

export default async function ContractorPaymentsPage() {
  const { company } = await getContractorContext();
  if (!company) {
    return (
      <div>
        <PageHeader title="Payments" />
        <EmptyState title="No company profile" description="Payment records are tied to your company." />
      </div>
    );
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_payments")
    .select("*, invoice:crm_invoices(id, invoice_code)")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });
  const payments = (data ?? []) as Payment[];
  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Invoice and payment history for your company." />
      {payments.length === 0 ? (
        <EmptyState title="No payment records found." description="When UBBIM issues an invoice or you complete a Stripe checkout, it will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                {["Invoice Number", "Payment ID", "Payment Type", "Amount", "Currency", "Payment Date", "Payment Status", ""].map((h) => (
                  <th key={h} className="px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t">
                  <td className="px-3 py-2">{payment.invoice?.invoice_code || "—"}</td>
                  <td className="px-3 py-2">
                    <Link href={`/contractor/payments/${payment.id}`} className="font-mono text-xs text-primary hover:underline">
                      {payment.payment_code}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{payment.payment_type}</td>
                  <td className="px-3 py-2">{formatMoney(payment.amount, payment.currency)}</td>
                  <td className="px-3 py-2">{payment.currency}</td>
                  <td className="px-3 py-2">{formatDate(payment.paid_at || payment.created_at)}</td>
                  <td className="px-3 py-2"><StatusBadge value={payment.status} /></td>
                  <td className="px-3 py-2"><ContractorPayButton payment={payment} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}