import Link from "next/link";
import { notFound } from "next/navigation";
import { ContractorPayButton } from "../pay-button";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getContractorContext } from "@/lib/contractor";
import { formatDateTime, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Payment } from "@/lib/types";

export default async function ContractorPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await getContractorContext();
  if (!company) notFound();
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_payments")
    .select("*, invoice:crm_invoices(id, invoice_code)")
    .eq("id", id)
    .eq("company_id", company.id)
    .maybeSingle();
  if (!data) notFound();
  const payment = data as Payment;
  return (
    <div className="space-y-6">
      <PageHeader
        title={payment.payment_code}
        description="Payment details for your company."
        actions={<Button asChild variant="outline"><Link href="/contractor/payments">Back</Link></Button>}
      />
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <Info label="Invoice Number" value={payment.invoice?.invoice_code} />
          <Info label="Payment ID" value={payment.payment_code} />
          <Info label="Payment Type" value={payment.payment_type} />
          <Info label="Amount" value={formatMoney(payment.amount, payment.currency)} />
          <Info label="Currency" value={payment.currency} />
          <div>
            <div className="text-xs text-muted-foreground">Payment Status</div>
            <div className="mt-1"><StatusBadge value={payment.status} /></div>
          </div>
          <Info label="Payment Date" value={formatDateTime(payment.paid_at || payment.created_at)} />
          <Info label="Remarks" value={payment.remarks} />
        </CardContent>
      </Card>
      <ContractorPayButton payment={payment} />
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value || "—"}</div>
    </div>
  );
}