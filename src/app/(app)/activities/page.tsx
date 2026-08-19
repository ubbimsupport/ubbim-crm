import { saveActivityAction } from "@/lib/actions/crm";
import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireProfile } from "@/lib/auth";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { canWriteRecords } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { Activity, Company } from "@/lib/types";

export default async function ActivitiesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [{ data }, { data: companies }] = await Promise.all([
    supabase.from("crm_activities").select("*, company:crm_companies(id, company_name, company_code), user:crm_profiles(id, full_name)").order("activity_date", { ascending: false }),
    supabase.from("crm_companies").select("id, company_name, company_code").order("company_name"),
  ]);
  const activities = (data ?? []) as Activity[];
  return (
    <div className="space-y-6">
      <PageHeader title="Activities" description="CRM timeline of calls, meetings, follow-ups, and notes." />
      {canWriteRecords(profile.role) ? (
        <form action={saveActivityAction} className="grid gap-2 rounded-xl border bg-card p-4 md:grid-cols-2">
          <select name="company_id" className="h-8 rounded-md border px-3 text-sm">
            <option value="">Company</option>
            {(companies as Company[] | null ?? []).map((c) => <option key={c.id} value={c.id}>{c.company_code} {c.company_name}</option>)}
          </select>
          <select name="activity_type" className="h-8 rounded-md border px-3 text-sm">
            {ACTIVITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <Input name="subject" placeholder="Subject" required />
          <Input name="follow_up_date" type="date" />
          <Textarea name="description" className="md:col-span-2" placeholder="Description" />
          <Button type="submit">Log activity</Button>
        </form>
      ) : null}
      {activities.length === 0 ? <EmptyState title="No activities" description="Log a call, meeting, or follow-up to start the timeline." /> : (
        <div className="space-y-3">
          {activities.map((item) => (
            <div key={item.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{item.subject}</div>
                <StatusBadge value={item.status} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {item.activity_type} · {item.company?.company_name || "Internal"} · {item.user?.full_name} · {formatDateTime(item.activity_date)}
              </div>
              <p className="mt-2 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
