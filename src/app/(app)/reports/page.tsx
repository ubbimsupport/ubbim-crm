import { PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { canGenerateReports } from "@/lib/rbac";
import { redirect } from "next/navigation";

const reports = [
  ["vendors", "Vendor List"],
  ["contractors", "Contractor List"],
  ["registrations", "Company Registration"],
  ["expired-documents", "Expired Documents"],
  ["expiring-documents", "Expiring Documents"],
  ["active-projects", "Active Projects"],
  ["completed-projects", "Completed Projects"],
  ["activities", "Activity Report"],
  ["payments", "Payment Report"],
  ["revenue", "Revenue Report"],
  ["vendor-performance", "Vendor Performance"],
  ["contractor-performance", "Contractor Performance"],
];

export default async function ReportsPage() {
  const profile = await requireProfile();
  if (!canGenerateReports(profile.role)) redirect("/dashboard");
  return (
    <div>
      <PageHeader title="Reports" description="Export operational, compliance, and financial reports as CSV, Excel, or PDF." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reports.map(([id, label]) => (
          <div key={id} className="rounded-xl border bg-card p-4">
            <div className="font-medium">{label}</div>
            <div className="mt-3 flex gap-2">
              <Button asChild variant="outline" size="sm"><a href={`/api/reports/export?type=${id}&format=csv`}>CSV</a></Button>
              <Button asChild variant="outline" size="sm"><a href={`/api/reports/export?type=${id}&format=xlsx`}>Excel</a></Button>
              <Button asChild variant="outline" size="sm"><a href={`/api/reports/export?type=${id}&format=pdf`}>PDF</a></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
