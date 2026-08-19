import { notFound } from "next/navigation";
import { saveProjectAction } from "@/lib/actions/crm";
import { PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireProfile } from "@/lib/auth";
import { PROJECT_STATUSES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Company, Profile, Project } from "@/lib/types";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: project }, { data: vendors }, { data: contractors }, { data: staff }] = await Promise.all([
    supabase.from("crm_projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("crm_companies").select("id, company_name, company_code").eq("company_kind", "vendor"),
    supabase.from("crm_companies").select("id, company_name, company_code").eq("company_kind", "contractor"),
    supabase.from("crm_profiles").select("id, full_name, email").eq("is_active", true),
  ]);
  if (!project) notFound();
  const current = project as Project;
  return (
    <div>
      <PageHeader title={`Edit ${current.project_name}`} />
      <form action={saveProjectAction} className="grid gap-4 rounded-xl border bg-card p-6 md:grid-cols-2">
        <input type="hidden" name="id" value={current.id} />
        <div className="space-y-2"><Label>Project name</Label><Input name="project_name" defaultValue={current.project_name} required /></div>
        <div className="space-y-2"><Label>Project number</Label><Input name="project_number" defaultValue={current.project_number ?? ""} /></div>
        <div className="space-y-2"><Label>Client</Label><Input name="client_name" defaultValue={current.client_name ?? ""} /></div>
        <div className="space-y-2">
          <Label>Vendor</Label>
          <select name="vendor_id" defaultValue={current.vendor_id ?? ""} className="h-8 w-full rounded-md border px-3 text-sm">
            <option value="">Select</option>
            {(vendors as Company[] | null ?? []).map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Contractor</Label>
          <select name="contractor_id" defaultValue={current.contractor_id ?? ""} className="h-8 w-full rounded-md border px-3 text-sm">
            <option value="">Select</option>
            {(contractors as Company[] | null ?? []).map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Project manager</Label>
          <select name="project_manager_id" defaultValue={current.project_manager_id ?? ""} className="h-8 w-full rounded-md border px-3 text-sm">
            <option value="">Select</option>
            {(staff as Profile[] | null ?? []).map((s) => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label>Start date</Label><Input type="date" name="start_date" defaultValue={current.start_date ?? ""} /></div>
        <div className="space-y-2"><Label>End date</Label><Input type="date" name="end_date" defaultValue={current.end_date ?? ""} /></div>
        <div className="space-y-2"><Label>Project value</Label><Input type="number" name="project_value" defaultValue={current.project_value} /></div>
        <div className="space-y-2"><Label>Location</Label><Input name="location" defaultValue={current.location ?? ""} /></div>
        <div className="space-y-2">
          <Label>Status</Label>
          <select name="status" defaultValue={current.status} className="h-8 w-full rounded-md border px-3 text-sm">
            {PROJECT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label>Progress</Label><Input type="number" name="progress" defaultValue={current.progress} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea name="description" defaultValue={current.description ?? ""} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Remarks</Label><Textarea name="remarks" defaultValue={current.remarks ?? ""} /></div>
        <div className="md:col-span-2"><Button type="submit">Save</Button></div>
      </form>
    </div>
  );
}
