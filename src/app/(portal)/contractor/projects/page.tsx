import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { getContractorContext } from "@/lib/contractor";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export default async function ContractorProjectsPage() {
  const { company, approved } = await getContractorContext();
  if (!company) {
    return (
      <div>
        <PageHeader title="Projects" />
        <EmptyState title="No company profile" description="Projects appear after your company is linked." />
      </div>
    );
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_projects")
    .select("*, project_manager:crm_profiles!project_manager_id(id, full_name)")
    .eq("contractor_id", company.id)
    .order("created_at", { ascending: false });
  const projects = (data ?? []) as Project[];
  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description="Projects assigned to your company. Contractors cannot delete or edit project records." />
      {!approved ? (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          Project work is available after UBBIM approves your contractor account.
        </p>
      ) : null}
      {projects.length === 0 ? (
        <EmptyState title="No projects assigned to your company." description="When UBBIM assigns a project, it will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                {["Project Number", "Project Name", "Client", "Location", "Project Manager", "Start Date", "End Date", "Project Value", "Status", "Progress %"].map((h) => (
                  <th key={h} className="px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{project.project_number || project.project_code}</td>
                  <td className="px-3 py-2">{project.project_name}</td>
                  <td className="px-3 py-2">{project.client_name || "—"}</td>
                  <td className="px-3 py-2">{project.location || "—"}</td>
                  <td className="px-3 py-2">{project.project_manager?.full_name || "—"}</td>
                  <td className="px-3 py-2">{formatDate(project.start_date)}</td>
                  <td className="px-3 py-2">{formatDate(project.end_date)}</td>
                  <td className="px-3 py-2">{formatMoney(project.project_value, project.currency)}</td>
                  <td className="px-3 py-2"><StatusBadge value={project.status} /></td>
                  <td className="px-3 py-2">{project.progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}