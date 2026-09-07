import { ComplianceTracker } from "@/components/contractor/compliance-tracker";
import { getContractorContext } from "@/lib/contractor";

export default async function ContractorDashboardPage() {
  const { company, contractor, approved } = await getContractorContext();

  return <ComplianceTracker company={company} contractor={contractor} approved={approved} />;
}
