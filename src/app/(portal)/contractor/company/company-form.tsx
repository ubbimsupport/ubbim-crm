"use client";

import { useActionState } from "react";
import { updateContractorCompanyAction, type ContractorFormState } from "@/lib/actions/contractor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CIDB_CATEGORIES, CIDB_GRADES, COMPANY_TYPES, MALAYSIAN_STATES } from "@/lib/constants";
import type { Company, Contact, Contractor } from "@/lib/types";

const initial: ContractorFormState = {};

export function ContractorCompanyForm({
  company,
  contractor,
  contact,
}: {
  company: Company;
  contractor: Contractor | null;
  contact: Contact | null;
}) {
  const [state, action, pending] = useActionState(updateContractorCompanyAction, initial);
  return (
    <form action={action} className="space-y-8">
      {state.error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{state.error}</p> : null}
      {state.ok ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p> : null}

      <section className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2">
        <h2 className="text-lg font-semibold text-primary md:col-span-2">Company information</h2>
        <Field label="Company Name" name="company_name" defaultValue={company.company_name} required />
        <Field label="Registration Number" name="registration_number" defaultValue={company.registration_number} />
        <Select label="Company Type" name="company_type" defaultValue={company.company_type} options={COMPANY_TYPES} />
        <Field label="Email" name="email" type="email" defaultValue={company.email} />
        <Field label="Phone" name="phone" defaultValue={company.phone} />
        <Field label="Website" name="website" defaultValue={company.website} />
        <div className="space-y-2 md:col-span-2">
          <Label>Business Address</Label>
          <Textarea name="address" defaultValue={company.address ?? ""} />
        </div>
        <Field label="Address Line 2" name="address_line2" defaultValue={company.address_line2} />
        <Field label="City" name="city" defaultValue={company.city} />
        <Select label="State" name="state" defaultValue={company.state} options={MALAYSIAN_STATES} />
        <Field label="Postcode" name="postcode" defaultValue={company.postcode} />
        <Field label="Country" name="country" defaultValue={company.country || "Malaysia"} />
      </section>

      <section className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2">
        <h2 className="text-lg font-semibold text-primary md:col-span-2">Contractor information</h2>
        <div className="space-y-2">
          <Label>Contractor ID</Label>
          <Input value={contractor?.contractor_code || "—"} disabled />
        </div>
        <Field label="CIDB Registration Number" name="cidb_registration_number" defaultValue={contractor?.cidb_registration_number} />
        <Select label="CIDB Grade" name="cidb_grade" defaultValue={contractor?.cidb_grade} options={CIDB_GRADES} />
        <Select label="CIDB Category" name="cidb_category" defaultValue={contractor?.cidb_category} options={CIDB_CATEGORIES} />
        <Field label="CIDB Specialization" name="specialization" defaultValue={contractor?.specialization} />
        <Field label="CIDB Issue Date" name="cidb_issue_date" type="date" defaultValue={contractor?.cidb_issue_date} />
        <Field label="CIDB Expiry Date" name="cidb_expiry_date" type="date" defaultValue={contractor?.cidb_expiry_date} />
      </section>

      <section className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2">
        <h2 className="text-lg font-semibold text-primary md:col-span-2">Primary contact</h2>
        {contact ? <input type="hidden" name="contact_id" value={contact.id} /> : null}
        <Field label="Name" name="contact_name" defaultValue={contact?.full_name || company.contact_person} />
        <Field label="Position" name="contact_position" defaultValue={contact?.position} />
        <Field label="Email" name="contact_email" type="email" defaultValue={contact?.email} />
        <Field label="Phone" name="contact_phone" defaultValue={contact?.phone} />
        <Field label="WhatsApp" name="contact_whatsapp" defaultValue={contact?.whatsapp} />
      </section>

      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save changes"}</Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} required={required} />
    </div>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: readonly string[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select name={name} defaultValue={defaultValue ?? ""} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
        <option value="">Select</option>
        {options.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}