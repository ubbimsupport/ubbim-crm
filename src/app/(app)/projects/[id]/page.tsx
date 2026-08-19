import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/crm/status-badge";
import { requireProfile } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { canManageCompanies } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_projects")
    .select("*, vendor:crm_companies!crm_projects_vendor_id_fkey(id, company_name, company_code), contractor:crm_companies!crm_projects_contractor_id_fkey(id, company_name, company_code), project_manager:crm_profiles!crm_projects_project_manager_id_fkey(id, full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const project = data as Project;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-amber-700">{project.project_code}</div>
          <h1 className="text-2xl font-semibold text-primary">{project.project_name}</h1>
          <StatusBadge value={project.status} />
        </div>
        {canManageCompanies(profile.role) ? <Button asChild><Link href={`/projects/${project.id}/edit`}>Edit</Link></Button> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Info label="Client" value={project.client_name} />
        <Info label="Vendor" value={project.vendor?.company_name} />
        <Info label="Contractor" value={project.contractor?.company_name} />
        <Info label="Project manager" value={project.project_manager?.full_name} />
        <Info label="Value" value={formatMoney(project.project_value, project.currency)} />
        <Info label="Progress" value={`${project.progress}%`} />
        <Info label="Start" value={formatDate(project.start_date)} />
        <Info label="End" value={formatDate(project.end_date)} />
        <Info label="Location" value={project.location} />
        <div className="rounded-lg border p-4 md:col-span-2 text-sm">{project.description || "No description"}</div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value || "—"}</div>
    </div>
  );
}
