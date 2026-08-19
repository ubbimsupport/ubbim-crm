import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { requireProfile } from "@/lib/auth";
import { PROJECT_STATUSES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { canManageCompanies } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const profile = await requireProfile();
  const query = await searchParams;
  const supabase = await createClient();
  let request = supabase.from("crm_projects").select("*, vendor:crm_companies!crm_projects_vendor_id_fkey(id, company_name, company_code), contractor:crm_companies!crm_projects_contractor_id_fkey(id, company_name, company_code)").order("created_at", { ascending: false });
  if (query.status) request = request.eq("status", query.status);
  if (query.q) request = request.or(`project_name.ilike.%${query.q}%,project_code.ilike.%${query.q}%,client_name.ilike.%${query.q}%`);
  const { data } = await request;
  const projects = (data ?? []) as Project[];
  return (
    <div>
      <PageHeader title="Projects" description="Track planning, active, and completed works." actions={canManageCompanies(profile.role) ? <Button asChild><Link href="/projects/new">Add project</Link></Button> : null} />
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={query.q} placeholder="Search projects" className="h-8 rounded-md border px-3 text-sm" />
        <select name="status" defaultValue={query.status ?? ""} className="h-8 rounded-md border px-3 text-sm">
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      {projects.length === 0 ? <EmptyState title="No projects" description="Create a project to link vendors and contractors." /> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Client</th><th className="px-3 py-2">Vendor</th><th className="px-3 py-2">Contractor</th><th className="px-3 py-2">Value</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">End</th></tr></thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2"><Link className="text-primary hover:underline" href={`/projects/${p.id}`}>{p.project_code}</Link></td>
                  <td className="px-3 py-2 font-medium">{p.project_name}</td>
                  <td className="px-3 py-2">{p.client_name}</td>
                  <td className="px-3 py-2">{p.vendor?.company_name}</td>
                  <td className="px-3 py-2">{p.contractor?.company_name}</td>
                  <td className="px-3 py-2">{formatMoney(p.project_value, p.currency)}</td>
                  <td className="px-3 py-2"><StatusBadge value={p.status} /></td>
                  <td className="px-3 py-2">{formatDate(p.end_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
