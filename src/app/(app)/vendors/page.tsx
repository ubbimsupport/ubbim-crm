import { CompanyDirectory } from "@/components/crm/company-directory";
import { requireProfile } from "@/lib/auth";
import { listCompanies } from "@/lib/queries";
import { canViewVendors, homePathForRole } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; state?: string; sort?: string }>;
}) {
  const profile = await requireProfile();
  if (!canViewVendors(profile.role)) redirect(homePathForRole(profile.role));
  const query = await searchParams;
  const companies = await listCompanies("all", query);
  return <CompanyDirectory kind="vendor" companies={companies} role={profile.role} query={query} />;
}
