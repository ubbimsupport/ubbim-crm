"use client";

import { useActionState, useState } from "react";
import { submitPublicRegistrationAction, type RegisterFormState } from "@/lib/actions/crm";
import { CIDB_GRADES, COMPANY_TYPES, MALAYSIAN_STATES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category, CompanyKind } from "@/lib/types";

const initialState: RegisterFormState = {};

export function RegistrationForm({
  categories,
  initialKind = "vendor",
  initialError,
}: {
  categories: Category[];
  initialKind?: CompanyKind;
  initialError?: string;
}) {
  const [state, formAction, pending] = useActionState(submitPublicRegistrationAction, initialState);
  const [kind, setKind] = useState<CompanyKind>(
    state.values?.kind === "contractor" || initialKind === "contractor" ? "contractor" : "vendor",
  );
  const values = state.values ?? {};
  const fieldErrors = state.fieldErrors ?? {};
  const formError = state.formError || initialError;
  const kindCategories = categories.filter((item) => item.kind === kind);

  return (
    <form key={state.nonce ?? "new"} action={formAction} noValidate className="grid gap-4 md:grid-cols-2">
      {formError ? (
        <p className="mb-0 rounded-md bg-red-50 p-3 text-sm text-red-800 md:col-span-2">{formError}</p>
      ) : null}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="kind">Registration type</Label>
        <select
          id="kind"
          name="kind"
          value={kind}
          onChange={(event) => setKind(event.target.value === "contractor" ? "contractor" : "vendor")}
          aria-invalid={Boolean(fieldErrors.kind) || undefined}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="vendor">Vendor</option>
          <option value="contractor">Contractor</option>
        </select>
        <FieldError message={fieldErrors.kind} />
      </div>
      <Field
        label="Company name"
        name="company_name"
        required
        defaultValue={values.company_name}
        error={fieldErrors.company_name}
      />
      <Field label="Registration number" name="registration_number" defaultValue={values.registration_number} />
      <div className="space-y-2">
        <Label>Company type</Label>
        <select
          name="company_type"
          defaultValue={values.company_type ?? ""}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Select</option>
          {COMPANY_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <select
          name="category_id"
          defaultValue={values.category_id ?? ""}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Select</option>
          {kindCategories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <Field label="Contact person" name="contact_person" defaultValue={values.contact_person} />
      <Field
        label="Email"
        name="email"
        type="email"
        required
        defaultValue={values.email}
        error={fieldErrors.email}
      />
      <Field label="Phone" name="phone" defaultValue={values.phone} />
      <div className="space-y-2">
        <Label>State</Label>
        <select
          name="state"
          defaultValue={values.state ?? ""}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Select</option>
          {MALAYSIAN_STATES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Address</Label>
        <Textarea name="address" defaultValue={values.address ?? ""} />
      </div>
      <Field
        label="CIDB grade"
        name="cidb_grade"
        placeholder={CIDB_GRADES.join(", ")}
        defaultValue={values.cidb_grade}
      />
      <Field
        label="CIDB registration number"
        name="cidb_registration_number"
        defaultValue={values.cidb_registration_number}
      />
      <Field
        label="CIDB expiry date"
        name="cidb_expiry_date"
        type="date"
        defaultValue={values.cidb_expiry_date}
      />
      <Field label="Specialization" name="specialization" defaultValue={values.specialization} />
      <div className="md:col-span-2">
        <Button type="submit" name="submit_register" disabled={pending} aria-label="Submit Register">
          Submit registration
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        aria-invalid={Boolean(error) || undefined}
      />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-red-700">{message}</p>;
}
