import { notFound } from "next/navigation";
import { CompanyForm } from "@/components/crm/company-form";
import { PageHeader } from "@/components/crm/page-header";
import { requireProfile } from "@/lib/auth";
import { getCompany } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { Category, Profile } from "@/lib/types";

export default async function EditVendorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;
  const company = await getCompany(id);
  if (!company || company.company_kind !== "vendor") notFound();
  const supabase = await createClient();
  const [{ data: categories }, { data: staff }] = await Promise.all([
    supabase.from("crm_categories").select("*").eq("kind", "vendor"),
    supabase.from("crm_profiles").select("*").eq("is_active", true),
  ]);
  return (
    <div>
      <PageHeader title={`Edit ${company.company_name}`} />
      <CompanyForm kind="vendor" company={company} categories={(categories ?? []) as Category[]} staff={(staff ?? []) as Profile[]} />
    </div>
  );
}
