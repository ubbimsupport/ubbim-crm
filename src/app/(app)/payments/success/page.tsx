import { PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div>
      <PageHeader title="Payment successful" description="Stripe confirmed this transaction. The CRM payment record will update from the webhook." />
      <Button asChild><Link href="/payments">Back to payments</Link></Button>
    </div>
  );
}
