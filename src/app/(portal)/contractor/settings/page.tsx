import { ContractorSettingsForms } from "./settings-forms";
import { PageHeader } from "@/components/crm/page-header";
import { getContractorContext, getNotificationSettings } from "@/lib/contractor";

export default async function ContractorSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await getContractorContext();
  const settings = await getNotificationSettings(profile.id);
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your contractor account, password, and notification preferences." />
      {params.reset ? (
        <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">A password reset email was sent.</p>
      ) : null}
      <ContractorSettingsForms profile={profile} settings={settings} />
    </div>
  );
}