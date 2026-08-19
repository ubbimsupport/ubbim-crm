import { saveSettingsAction } from "@/lib/actions/crm";
import { PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireProfile } from "@/lib/auth";
import { canManageSettings } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const profile = await requireProfile();
  if (!canManageSettings(profile.role)) redirect("/dashboard");
  const supabase = await createClient();
  const { data } = await supabase.from("crm_settings").select("*");
  const settings = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
  return (
    <div>
      <PageHeader title="Settings" description="Organisation, currency, and registration fee configuration." />
      <form action={saveSettingsAction} className="grid max-w-xl gap-4 rounded-xl border bg-card p-6">
        <div className="space-y-2"><Label>Organisation name</Label><Input name="organization_name" defaultValue={String(settings.organization_name ?? "UBBIM").replaceAll('"', "")} /></div>
        <div className="space-y-2"><Label>Support email</Label><Input name="support_email" defaultValue={String(settings.support_email ?? "").replaceAll('"', "")} /></div>
        <div className="space-y-2"><Label>Currency</Label><Input name="currency" defaultValue={String(settings.currency ?? "MYR").replaceAll('"', "")} /></div>
        <div className="space-y-2"><Label>Vendor registration fee</Label><Input name="vendor_registration_fee" type="number" defaultValue={String(settings.vendor_registration_fee ?? 150)} /></div>
        <div className="space-y-2"><Label>Contractor registration fee</Label><Input name="contractor_registration_fee" type="number" defaultValue={String(settings.contractor_registration_fee ?? 250)} /></div>
        <Button type="submit">Save settings</Button>
      </form>
    </div>
  );
}
