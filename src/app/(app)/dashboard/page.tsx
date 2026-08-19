import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts } from "@/components/crm/dashboard-charts";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { requireProfile } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Activity, Company, CrmDocument } from "@/lib/types";

function countBy<T>(rows: T[], key: (row: T) => string) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = key(row) || "unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function toChart(record: Record<string, number>) {
  return Object.entries(record).map(([name, value]) => ({ name, value }));
}

function monthKey(value?: string | null) {
  return value ? value.slice(0, 7) : "";
}

export default async function DashboardPage() {
  await requireProfile();
  const supabase = await createClient();
  const [
    companiesRes,
    projectsRes,
    documentsRes,
    paymentsRes,
    activitiesRes,
  ] = await Promise.all([
    supabase.from("crm_companies").select("*"),
    supabase.from("crm_projects").select("*"),
    supabase.from("crm_documents").select("*, company:crm_companies(id, company_name, company_code)"),
    supabase.from("crm_payments").select("*"),
    supabase.from("crm_activities").select("*, company:crm_companies(id, company_name), user:crm_profiles(id, full_name)").order("activity_date", { ascending: false }).limit(8),
  ]);

  const companies = (companiesRes.data ?? []) as Company[];
  const projects = projectsRes.data ?? [];
  const documents = (documentsRes.data ?? []) as CrmDocument[];
  const payments = paymentsRes.data ?? [];
  const activities = (activitiesRes.data ?? []) as Activity[];

  const vendors = companies.filter((c) => c.company_kind === "vendor");
  const contractors = companies.filter((c) => c.company_kind === "contractor");
  const paid = payments.filter((p) => p.status === "paid");
  const pendingPay = payments.filter((p) => p.status === "pending");
  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const monthlyRevenue = paid
    .filter((p) => (p.paid_at || p.created_at || "").startsWith(month))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return date.toISOString().slice(0, 7);
  });

  const stats = [
    { label: "Total vendors", value: vendors.length },
    { label: "Total contractors", value: contractors.length },
    { label: "Active vendors", value: vendors.filter((c) => c.status === "active").length },
    { label: "Active contractors", value: contractors.filter((c) => c.status === "active").length },
    { label: "Pending registration", value: companies.filter((c) => c.status === "pending").length },
    { label: "Expired documents", value: documents.filter((d) => d.status === "expired").length },
    { label: "Expiring soon", value: documents.filter((d) => d.status === "expiring_soon").length },
    { label: "Active projects", value: projects.filter((p) => p.status === "active").length },
    { label: "Completed projects", value: projects.filter((p) => p.status === "completed").length },
    { label: "Total payments", value: formatMoney(payments.reduce((s, p) => s + Number(p.amount || 0), 0)) },
    { label: "Pending payments", value: formatMoney(pendingPay.reduce((s, p) => s + Number(p.amount || 0), 0)) },
    { label: "Monthly revenue", value: formatMoney(monthlyRevenue) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Executive dashboard" description="Live view of UBBIM vendor, contractor, project, and payment operations." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-primary">{item.value}</CardContent>
          </Card>
        ))}
      </div>
      <DashboardCharts
        vendorContractor={[
          { name: "Vendors", value: vendors.length },
          { name: "Contractors", value: contractors.length },
        ]}
        companyStatus={toChart(countBy(companies, (c) => c.status))}
        projectStatus={toChart(countBy(projects, (p) => String(p.status)))}
        monthlyRegistration={months.map((name) => ({
          name,
          vendors: vendors.filter((c) => monthKey(c.created_at) === name).length,
          contractors: contractors.filter((c) => monthKey(c.created_at) === name).length,
        }))}
        monthlyRevenue={months.map((name) => ({
          name,
          revenue: paid.filter((p) => monthKey(p.paid_at || p.created_at) === name).reduce((s, p) => s + Number(p.amount || 0), 0),
        }))}
        documentExpiry={toChart(countBy(documents, (d) => d.status))}
        paymentStatus={toChart(countBy(payments, (p) => String(p.status)))}
      />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader><CardTitle>Recent activities</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {activities.map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="font-medium">{item.subject}</div>
                <div className="text-xs text-muted-foreground">{item.company?.company_name} · {formatDate(item.activity_date)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent registrations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {companies.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8).map((item) => (
              <Link key={item.id} href={`/${item.company_kind}s/${item.id}`} className="block rounded-md border p-3 hover:bg-muted/40">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.company_name}</span>
                  <StatusBadge value={item.status} />
                </div>
                <div className="text-xs text-muted-foreground">{item.company_code} · {formatDate(item.created_at)}</div>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Upcoming expiry dates</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {documents.filter((d) => d.expiry_date).sort((a, b) => (a.expiry_date || "").localeCompare(b.expiry_date || "")).slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.document_name}</span>
                  <StatusBadge value={item.status} />
                </div>
                <div className="text-xs text-muted-foreground">{item.company?.company_name} · {formatDate(item.expiry_date)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
