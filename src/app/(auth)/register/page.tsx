import { createClient } from "@/lib/supabase/server";
import { submitPublicRegistrationAction } from "@/lib/actions/crm";
import { CIDB_GRADES, COMPANY_TYPES, MALAYSIAN_STATES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import type { Category } from "@/lib/types";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("crm_categories").select("*").eq("is_active", true);
  const categories = (data ?? []) as Category[];
  const kind = params.kind === "contractor" ? "contractor" : "vendor";

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <div className="text-xs font-semibold tracking-[0.25em] text-amber-700">UBBIM</div>
          <CardTitle>Vendor / contractor registration</CardTitle>
          <CardDescription>Submit a company registration for UBBIM review. You will receive an email confirmation.</CardDescription>
        </CardHeader>
        <CardContent>
          {params.success ? (
            <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
              Registration submitted. Our team will review your application.
            </p>
          ) : null}
          {params.error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{params.error}</p> : null}
          <form action={submitPublicRegistrationAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="kind">Registration type</Label>
              <select id="kind" name="kind" defaultValue={kind} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="vendor">Vendor</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
            <Field label="Company name" name="company_name" required />
            <Field label="Registration number" name="registration_number" />
            <div className="space-y-2">
              <Label>Company type</Label>
              <select name="company_type" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Select</option>
                {COMPANY_TYPES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select name="category_id" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Select</option>
                {categories.filter((item) => item.kind === kind).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <Field label="Contact person" name="contact_person" />
            <Field label="Email" name="email" type="email" required />
            <Field label="Phone" name="phone" />
            <div className="space-y-2">
              <Label>State</Label>
              <select name="state" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Select</option>
                {MALAYSIAN_STATES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Textarea name="address" />
            </div>
            <Field label="CIDB grade" name="cidb_grade" placeholder={CIDB_GRADES.join(", ")} />
            <Field label="CIDB registration number" name="cidb_registration_number" />
            <Field label="CIDB expiry date" name="cidb_expiry_date" type="date" />
            <Field label="Specialization" name="specialization" />
            <div className="md:col-span-2">
              <Button type="submit">Submit registration</Button>
            </div>
          </form>
          <Link href="/login" className="mt-4 inline-block text-sm text-primary hover:underline">Staff sign in</Link>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} />
    </div>
  );
}
