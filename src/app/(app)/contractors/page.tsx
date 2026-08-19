import { CompanyDirectory } from "@/components/crm/company-directory";
import { requireProfile } from "@/lib/auth";
import { listCompanies } from "@/lib/queries";

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; state?: string; sort?: string }>;
}) {
  const profile = await requireProfile();
  const query = await searchParams;
  const companies = await listCompanies("contractor", query);
  return <CompanyDirectory kind="contractor" companies={companies} role={profile.role} query={query} />;
}
