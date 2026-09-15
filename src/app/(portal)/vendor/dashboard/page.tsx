import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

export default async function VendorDashboardPage() {
  const profile = await requireRole(["user"]);
  const supabase = await createClient();
  const company = profile.company_id
    ? ((
        await supabase
          .from("crm_companies")
          .select("company_name, company_code, status, company_kind")
          .eq("id", profile.company_id)
          .maybeSingle()
      ).data as Pick<Company, "company_name" | "company_code" | "status" | "company_kind"> | null)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor dashboard"
        description="Your UBBIM vendor portal home. Staff CRM tools are not available on this account."
      />
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="inset-panel flex items-center justify-between gap-3 p-3">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{profile.full_name || "—"}</span>
          </div>
          <div className="inset-panel flex items-center justify-between gap-3 p-3">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{profile.email}</span>
          </div>
          <div className="inset-panel flex items-center justify-between gap-3 p-3">
            <span className="text-muted-foreground">Role</span>
            <StatusBadge value="vendor" />
          </div>
          {company ? (
            <>
              <div className="inset-panel flex items-center justify-between gap-3 p-3">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium">{company.company_name}</span>
              </div>
              <div className="inset-panel flex items-center justify-between gap-3 p-3">
                <span className="text-muted-foreground">Company code</span>
                <span className="font-medium">{company.company_code}</span>
              </div>
              <div className="inset-panel flex items-center justify-between gap-3 p-3">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge value={company.status} />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
