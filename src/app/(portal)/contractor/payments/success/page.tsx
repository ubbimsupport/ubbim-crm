import { PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ContractorPaymentSuccessPage() {
  return (
    <div>
      <PageHeader title="Payment successful" description="Stripe confirmed this transaction. Your payment record will update from the webhook." />
      <Button asChild><Link href="/contractor/payments">Back to payments</Link></Button>
    </div>
  );
}