import { saveProjectAction } from "@/lib/actions/crm";
import { PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireProfile } from "@/lib/auth";
import { PROJECT_STATUSES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Company, Profile } from "@/lib/types";

export default async function NewProjectPage() {
  await requireProfile();
  const supabase = await createClient();
  const [{ data: vendors }, { data: contractors }, { data: staff }] = await Promise.all([
    supabase.from("crm_companies").select("id, company_name, company_code").eq("company_kind", "vendor"),
    supabase.from("crm_companies").select("id, company_name, company_code").eq("company_kind", "contractor"),
    supabase.from("crm_profiles").select("id, full_name, email").eq("is_active", true),
  ]);
  return (
    <div>
      <PageHeader title="New project" />
      <form action={saveProjectAction} className="grid gap-4 rounded-xl border bg-card p-6 md:grid-cols-2">
        <Field label="Project name" name="project_name" required />
        <Field label="Project number" name="project_number" />
        <Field label="Client" name="client_name" />
        <Select label="Vendor" name="vendor_id" options={(vendors as Pick<Company, "id" | "company_name" | "company_code">[] | null ?? []).map((c) => ({ value: c.id, label: `${c.company_code} ${c.company_name}` }))} />
        <Select label="Contractor" name="contractor_id" options={(contractors as Pick<Company, "id" | "company_name" | "company_code">[] | null ?? []).map((c) => ({ value: c.id, label: `${c.company_code} ${c.company_name}` }))} />
        <Select label="Project manager" name="project_manager_id" options={(staff as Pick<Profile, "id" | "full_name" | "email">[] | null ?? []).map((s) => ({ value: s.id, label: s.full_name || s.email }))} />
        <Field label="Start date" name="start_date" type="date" />
        <Field label="End date" name="end_date" type="date" />
        <Field label="Project value" name="project_value" type="number" />
        <Field label="Location" name="location" />
        <Select label="Status" name="status" defaultValue="planning" options={PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
        <Field label="Progress %" name="progress" type="number" defaultValue="0" />
        <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea name="description" /></div>
        <div className="space-y-2 md:col-span-2"><Label>Remarks</Label><Textarea name="remarks" /></div>
        <div className="md:col-span-2"><Button type="submit">Create project</Button></div>
      </form>
    </div>
  );
}

function Field(props: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <Label>{props.label}</Label>
      <Input name={props.name} type={props.type ?? "text"} defaultValue={props.defaultValue} required={props.required} />
    </div>
  );
}

function Select(props: { label: string; name: string; options: { value: string; label: string }[]; defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <Label>{props.label}</Label>
      <select name={props.name} defaultValue={props.defaultValue ?? ""} className="h-8 w-full rounded-md border px-3 text-sm">
        <option value="">Select</option>
        {props.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
