import { CompanyForm } from "@/components/crm/company-form";
import { PageHeader } from "@/components/crm/page-header";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Category, Profile } from "@/lib/types";

export default async function NewVendorPage() {
  await requireRole(["super_admin", "admin"]);
  const supabase = await createClient();
  const [{ data: categories }, { data: staff }] = await Promise.all([
    supabase.from("crm_categories").select("*").eq("kind", "vendor"),
    supabase.from("crm_profiles").select("*").eq("is_active", true),
  ]);
  return (
    <div>
      <PageHeader title="Add vendor" description="Register a new vendor company in the UBBIM CRM." />
      <CompanyForm kind="vendor" categories={(categories ?? []) as Category[]} staff={(staff ?? []) as Profile[]} />
    </div>
  );
}
