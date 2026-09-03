import Link from "next/link";
import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { Meter, StatCard } from "@/components/contractor/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cidbStatus, getContractorContext, profileCompletion } from "@/lib/contractor";
import { documentDisplayStatus } from "@/lib/document-status";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Activity, CrmDocument, Notification, Payment, Project } from "@/lib/types";

export default async function ContractorDashboardPage() {
  const { profile, company, contractor, contact, approved } = await getContractorContext();
  const supabase = await createClient();

  const [documentsRes, projectsRes, paymentsRes, activitiesRes, notificationsRes] = company
    ? await Promise.all([
        supabase.from("crm_documents").select("*").eq("company_id", company.id),
        supabase.from("crm_projects").select("*").eq("contractor_id", company.id),
        supabase.from("crm_payments").select("*").eq("company_id", company.id),
        supabase
          .from("crm_activities")
          .select("*")
          .eq("company_id", company.id)
          .order("activity_date", { ascending: false })
          .limit(8),
        supabase
          .from("crm_notifications")
          .select("*")
          .eq("user_id", profile.id)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(6),
      ])
    : [
        { data: [] },
        { data: [] },
        { data: [] },
        { data: [] },
        { data: [] },
      ];

  const documents = (documentsRes.data ?? []) as CrmDocument[];
  const projects = (projectsRes.data ?? []) as Project[];
  const payments = (paymentsRes.data ?? []) as Payment[];
  const activities = (activitiesRes.data ?? []) as Activity[];
  const notifications = (notificationsRes.data ?? []) as Notification[];
  const completion = profileCompletion({ company, contractor, contact });
  const cidb = cidbStatus(contractor?.cidb_expiry_date);
  const displayDocs = documents.map((doc) => documentDisplayStatus(doc));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile.full_name || company?.company_name || "contractor"}`}
        description={company?.company_name || "Complete your company registration to finish onboarding."}
      />
      {!company ? (
        <EmptyState
          title="No company linked"
          description="Your contractor profile is not linked to a company yet. Register your company or contact UBBIM."
        />
      ) : null}
      {company && !approved ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 text-sm text-amber-950">
            {company.status === "rejected" ? (
              <>
                <p className="font-semibold">Your UBBIM Contractor registration has been rejected.</p>
                {company.rejection_reason ? <p className="mt-2">{company.rejection_reason}</p> : null}
              </>
            ) : company.status === "inactive" ? (
              <p className="font-semibold">Your contractor account is suspended. Contact UBBIM support.</p>
            ) : (
              <p className="font-semibold">
                Your registration is pending review. You can update your company profile and upload documents while you wait.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Company" value={company?.company_name || "—"} hint={contractor?.contractor_code || "Contractor ID pending"} />
        <StatCard label="CIDB Grade" value={contractor?.cidb_grade || "—"} hint={`Status: ${cidb.replaceAll("_", " ")}`} />
        <StatCard label="CIDB expiry" value={formatDate(contractor?.cidb_expiry_date)} />
        <StatCard label="Profile completion" value={`${completion}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile completion</CardTitle>
          </CardHeader>
          <CardContent>
            <Meter label="Company Profile" value={completion} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Document status</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Count label="Active" value={displayDocs.filter((s) => s === "active").length} />
            <Count label="Pending Review" value={displayDocs.filter((s) => s === "pending_review").length} />
            <Count label="Expiring Soon" value={displayDocs.filter((s) => s === "expiring_soon").length} />
            <Count label="Expired" value={displayDocs.filter((s) => s === "expired").length} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Project summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Count label="Planning" value={projects.filter((p) => p.status === "planning").length} />
            <Count label="Active" value={projects.filter((p) => p.status === "active").length} />
            <Count label="On Hold" value={projects.filter((p) => p.status === "on_hold").length} />
            <Count label="Completed" value={projects.filter((p) => p.status === "completed").length} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Count label="Pending" value={payments.filter((p) => p.status === "pending").length} />
            <Count label="Paid" value={payments.filter((p) => p.status === "paid").length} />
            <Count label="Failed" value={payments.filter((p) => p.status === "failed").length} />
            <Count label="Refunded" value={payments.filter((p) => p.status === "refunded").length} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active projects" value={projects.filter((p) => p.status === "active").length} />
        <StatCard label="Completed projects" value={projects.filter((p) => p.status === "completed").length} />
        <StatCard label="Total documents" value={documents.length} />
        <StatCard
          label="Documents expiring soon"
          value={documents.filter((d) => d.status === "expiring_soon").length}
        />
        <StatCard label="Pending payments" value={payments.filter((p) => p.status === "pending").length} />
        <StatCard label="Completed payments" value={payments.filter((p) => p.status === "paid").length} />
        <StatCard label="Contractor ID" value={contractor?.contractor_code || "—"} />
        <StatCard label="CIDB status" value={cidb.replaceAll("_", " ")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <Link href="/contractor/activities" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent contractor activities.</p>
            ) : (
              activities.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <div className="font-medium">{item.subject}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(item.activity_date)}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Notifications</CardTitle>
            <Link href="/contractor/notifications" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No unread notifications.</p>
            ) : (
              notifications.map((item) => (
                <Link key={item.id} href={item.link || "/contractor/notifications"} className="block rounded-md border p-3">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{formatRelative(item.created_at)}</div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-primary">{value}</span>
    </div>
  );
}