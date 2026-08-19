import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { canViewAudit } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { AuditLog } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function AuditLogsPage() {
  const profile = await requireProfile();
  if (!canViewAudit(profile.role)) redirect("/dashboard");
  const supabase = await createClient();
  const { data } = await supabase.from("crm_audit_logs").select("*, user:crm_profiles(id, full_name, email)").order("created_at", { ascending: false }).limit(200);
  const logs = (data ?? []) as AuditLog[];
  return (
    <div>
      <PageHeader title="Audit logs" description="Immutable record of CRM data changes." />
      {logs.length === 0 ? <EmptyState title="No audit events" description="Changes to companies, documents, payments, and users will appear here." /> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr><th className="px-3 py-2">When</th><th className="px-3 py-2">User</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Module</th><th className="px-3 py-2">Record</th></tr></thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                  <td className="px-3 py-2">{log.user?.full_name || log.user?.email || "System"}</td>
                  <td className="px-3 py-2">{log.action}</td>
                  <td className="px-3 py-2">{log.module}</td>
                  <td className="px-3 py-2 font-mono text-xs">{log.record_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
