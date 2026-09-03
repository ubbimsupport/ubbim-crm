"use client";

import { useActionState, useState } from "react";
import { submitPublicRegistrationAction, type RegisterFormState } from "@/lib/actions/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: RegisterFormState = {};

export function ContractorRegisterForm({ initialError }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState(submitPublicRegistrationAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const values = state.values ?? {};
  const fieldErrors = state.fieldErrors ?? {};
  const formError = state.formError || initialError;

  return (
    <form action={formAction} noValidate className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="kind" value="contractor" />
      <input type="hidden" name="portal" value="contractor" />
      {formError ? (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-800 md:col-span-2">{formError}</p>
      ) : null}
      <Field label="Company Name" name="company_name" required defaultValue={values.company_name} error={fieldErrors.company_name} />
      <Field label="Registration Number" name="registration_number" required defaultValue={values.registration_number} />
      <Field label="Contact Person" name="contact_person" required defaultValue={values.contact_person} />
      <Field label="Email" name="email" type="email" required defaultValue={values.email} error={fieldErrors.email} />
      <Field label="Phone" name="phone" required defaultValue={values.phone} />
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="new-password"
          minLength={8}
          aria-invalid={Boolean(fieldErrors.password) || undefined}
        />
        {fieldErrors.password ? <p className="text-sm text-red-700">{fieldErrors.password}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.confirm_password) || undefined}
        />
        {fieldErrors.confirm_password ? <p className="text-sm text-red-700">{fieldErrors.confirm_password}</p> : null}
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
        <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
        Show passwords
      </label>
      <p className="text-sm text-muted-foreground md:col-span-2">
        Your account is created immediately. Access to the full portal stays pending until UBBIM approves your registration.
      </p>
      <div className="md:col-span-2">
        <Button type="submit" className="w-full md:w-auto" disabled={pending}>
          {pending ? "Submitting..." : "Register"}
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
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue ?? ""} />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}