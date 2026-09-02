"use client";

import { useActionState } from "react";
import { upsertCompanyAction, type CompanyFormState } from "@/lib/actions/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CIDB_GRADES, COMPANY_STATUSES, COMPANY_TYPES, MALAYSIAN_STATES } from "@/lib/constants";
import type { Category, Company, CompanyKind, Profile } from "@/lib/types";

const initialState: CompanyFormState = {};

export function CompanyForm({
  kind,
  company,
  categories,
  staff,
}: {
  kind: CompanyKind;
  company?: Company | null;
  categories: Category[];
  staff: Profile[];
}) {
  const [state, formAction, pending] = useActionState(upsertCompanyAction, initialState);
  const vendor = company?.vendor;
  const contractor = company?.contractor;
  const categoryOptions = categories.filter((item) => item.kind === kind || item.kind === "vendor");
  return (
    <form action={formAction} className="grid gap-4 rounded-xl border bg-card p-6 md:grid-cols-2">
      <input type="hidden" name="kind" value={kind} />
      {company ? <input type="hidden" name="id" value={company.id} /> : null}
      {state.error ? (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-800 md:col-span-2">{state.error}</p>
      ) : null}
      <Field label="Company name" name="company_name" defaultValue={company?.company_name} required />
      <Field label="Registration number" name="registration_number" defaultValue={company?.registration_number} />
      <SelectField label="Company type" name="company_type" defaultValue={company?.company_type} options={COMPANY_TYPES.map((v) => ({ value: v, label: v }))} />
      <SelectField
        label="Category"
        name="category_id"
        defaultValue={company?.category_id}
        options={categoryOptions.map((c) => ({ value: c.id, label: c.name }))}
      />
      <Field label="Contact person" name="contact_person" defaultValue={company?.contact_person} />
      <Field label="Email" name="email" type="email" defaultValue={company?.email} />
      <Field label="Phone" name="phone" defaultValue={company?.phone} />
      <SelectField label="State" name="state" defaultValue={company?.state} options={MALAYSIAN_STATES.map((v) => ({ value: v, label: v }))} />
      <div className="space-y-2 md:col-span-2">
        <Label>Address</Label>
        <Textarea name="address" defaultValue={company?.address ?? ""} />
      </div>
      <Field label="City" name="city" defaultValue={company?.city} />
      <Field label="Postcode" name="postcode" defaultValue={company?.postcode} />
      <SelectField
        label="PIC"
        name="pic_id"
        defaultValue={company?.pic_id}
        options={staff.map((s) => ({ value: s.id, label: s.full_name || s.email }))}
      />
      <SelectField label="Business status" name="status" defaultValue={company?.status ?? "pending"} options={COMPANY_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
      <Field label="Registration date" name="registration_date" type="date" defaultValue={company?.registration_date ?? ""} />
      <Field label="Expiry date" name="expiry_date" type="date" defaultValue={company?.expiry_date ?? ""} />
      <Field label="Rating" name="rating" type="number" defaultValue={company?.rating?.toString() ?? ""} min="0" max="5" />
      {kind === "vendor" ? (
        <Field label="Specialization" name="specialization" defaultValue={vendor?.specialization} />
      ) : (
        <>
          <SelectField label="CIDB grade" name="cidb_grade" defaultValue={contractor?.cidb_grade} options={CIDB_GRADES.map((v) => ({ value: v, label: v }))} />
          <Field label="CIDB registration number" name="cidb_registration_number" defaultValue={contractor?.cidb_registration_number} />
          <Field label="CIDB expiry date" name="cidb_expiry_date" type="date" defaultValue={contractor?.cidb_expiry_date ?? ""} />
          <Field label="Specialization" name="specialization" defaultValue={contractor?.specialization} />
        </>
      )}
      <div className="space-y-2 md:col-span-2">
        <Label>Remarks</Label>
        <Textarea name="remarks" defaultValue={company?.remarks ?? ""} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : company ? "Save changes" : "Create vendor"}</Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  required?: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        min={min}
        max={max}
        step={type === "number" ? "0.1" : undefined}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select name={name} defaultValue={defaultValue ?? ""} className="h-8 w-full rounded-md border bg-background px-3 text-sm">
        <option value="">Select</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
    </div>
  );
}
