import { CompanyDirectory } from "@/components/crm/company-directory";
import { requireProfile } from "@/lib/auth";
import { listCompanies } from "@/lib/queries";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; state?: string; sort?: string; funnel?: string }>;
}) {
  const profile = await requireProfile();
  const query = await searchParams;
  const companies = await listCompanies("all", query);
  return <CompanyDirectory kind="vendor" companies={companies} role={profile.role} query={query} />;
}
