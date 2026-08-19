import { PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentFailedPage() {
  return (
    <div>
      <PageHeader title="Payment cancelled or failed" description="No charge was completed. You can retry checkout from the payments dashboard." />
      <Button asChild><Link href="/payments">Back to payments</Link></Button>
    </div>
  );
}
