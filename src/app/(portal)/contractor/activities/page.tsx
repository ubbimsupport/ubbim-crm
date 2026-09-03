import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { getContractorContext } from "@/lib/contractor";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Activity } from "@/lib/types";

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ContractorActivitiesPage() {
  const { company } = await getContractorContext();
  if (!company) {
    return (
      <div>
        <PageHeader title="Activities" />
        <EmptyState title="No company profile" description="Activity history is stored against your company." />
      </div>
    );
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_activities")
    .select("*")
    .eq("company_id", company.id)
    .order("activity_date", { ascending: false });
  const activities = (data ?? []) as Activity[];
  const groups = new Map<string, Activity[]>();
  for (const item of activities) {
    const key = dayLabel(item.activity_date);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Activities" description="Read-only timeline of your contractor account. Audit records cannot be edited or deleted." />
      {activities.length === 0 ? (
        <EmptyState title="No activity yet." description="Profile updates, document uploads, payments, and support tickets will appear here." />
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-3 text-sm font-semibold text-primary">{day}</h2>
              <div className="relative space-y-3 border-l pl-6">
                {items.map((item) => (
                  <div key={item.id} className="relative">
                    <span className="absolute -left-[1.55rem] top-2 size-2.5 rounded-full bg-primary" />
                    <div className="rounded-xl border bg-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium">{item.subject}</div>
                        <StatusBadge value={item.activity_type} />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.activity_date)}</div>
                      {item.description ? <p className="mt-2 text-sm">{item.description}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}