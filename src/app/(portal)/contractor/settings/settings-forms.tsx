"use client";

import { useActionState } from "react";
import {
  changeContractorPasswordAction,
  requestContractorPasswordResetFromSettingsAction,
  saveContractorNotificationSettingsAction,
  updateContractorAccountAction,
  type ContractorFormState,
} from "@/lib/actions/contractor";
import { signOutAction } from "@/lib/actions/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContractorNotificationSettings, Profile } from "@/lib/types";

const initial: ContractorFormState = {};

export function ContractorSettingsForms({
  profile,
  settings,
}: {
  profile: Profile;
  settings: ContractorNotificationSettings;
}) {
  const [account, accountAction, accountPending] = useActionState(updateContractorAccountAction, initial);
  const [password, passwordAction, passwordPending] = useActionState(changeContractorPasswordAction, initial);

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold text-primary">Account</h2>
        <form action={accountAction} className="grid gap-4 md:grid-cols-2">
          {account.error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-800 md:col-span-2">{account.error}</p> : null}
          {account.ok ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 md:col-span-2">{account.message}</p> : null}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={accountPending}>{accountPending ? "Saving..." : "Save account"}</Button>
          </div>
        </form>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold text-primary">Security</h2>
        <form action={passwordAction} className="grid gap-4 md:grid-cols-2">
          {password.error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-800 md:col-span-2">{password.error}</p> : null}
          {password.ok ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 md:col-span-2">{password.message}</p> : null}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="current_password">Current password</Label>
            <Input id="current_password" name="current_password" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm password</Label>
            <Input id="confirm_password" name="confirm_password" type="password" required />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={passwordPending}>{passwordPending ? "Updating..." : "Change password"}</Button>
          </div>
        </form>
        <form action={requestContractorPasswordResetFromSettingsAction}>
          <Button type="submit" variant="outline">Send reset email</Button>
        </form>
        <form action={signOutAction}>
          <input type="hidden" name="portal" value="contractor" />
          <Button type="submit" variant="destructive">Sign out</Button>
        </form>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold text-primary">Notifications</h2>
        <form action={saveContractorNotificationSettingsAction} className="space-y-3">
          <Toggle name="email_notifications" label="Email notifications" defaultChecked={settings.email_notifications} />
          <Toggle name="document_expiry_alerts" label="Document expiry alerts" defaultChecked={settings.document_expiry_alerts} />
          <Toggle name="payment_notifications" label="Payment notifications" defaultChecked={settings.payment_notifications} />
          <Toggle name="project_notifications" label="Project notifications" defaultChecked={settings.project_notifications} />
          <Toggle name="support_notifications" label="Support notifications" defaultChecked={settings.support_notifications} />
          <Button type="submit">Save notification preferences</Button>
        </form>
      </section>
    </div>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
      <span>{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4" />
    </label>
  );
}