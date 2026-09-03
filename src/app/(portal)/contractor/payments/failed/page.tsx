import { PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ContractorPaymentFailedPage() {
  return (
    <div>
      <PageHeader title="Payment cancelled or failed" description="No charge was completed. You can retry from the payments page." />
      <Button asChild><Link href="/contractor/payments">Back to payments</Link></Button>
    </div>
  );
}