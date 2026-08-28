import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";

export default async function UserDashboardPage() {
  const profile = await requireRole(["user"]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="User dashboard"
        description="Your UBBIM portal home. Staff CRM tools are not available on this account."
      />
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{profile.full_name || "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{profile.email}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <span className="text-muted-foreground">Role</span>
            <StatusBadge value={profile.role} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
