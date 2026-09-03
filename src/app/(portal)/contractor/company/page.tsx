import { ContractorCompanyForm } from "./company-form";
import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { getContractorContext } from "@/lib/contractor";

export default async function ContractorCompanyPage() {
  const { company, contractor, contact } = await getContractorContext();
  if (!company) {
    return (
      <div>
        <PageHeader title="My Company" />
        <EmptyState title="No company profile" description="Your account is not linked to a contractor company yet." />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Company"
        description="Update permitted company and CIDB details. Internal status, rating, and admin notes cannot be changed."
      />
      <div className="flex flex-wrap gap-2">
        <StatusBadge value={company.status} />
        <StatusBadge value={contractor?.contractor_code} />
      </div>
      <ContractorCompanyForm company={company} contractor={contractor} contact={contact} />
    </div>
  );
}