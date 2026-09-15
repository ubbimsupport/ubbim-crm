import { createUserAction, updateUserRoleAction } from "@/lib/actions/crm";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireProfile } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { canManageUsers } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const profile = await requireProfile();
  if (!canManageUsers(profile.role)) redirect("/dashboard");
  const supabase = await createClient();
  const { data } = await supabase.from("crm_profiles").select("*").order("created_at", { ascending: false });
  const users = (data ?? []) as Profile[];
  return (
    <div className="space-y-6">
      <PageHeader title="Users & roles" description="Super Admin control of CRM access." />
      <form action={createUserAction} className="grid gap-2 rounded-2xl glass-panel p-4 md:grid-cols-5">
        <Input name="full_name" placeholder="Full name" required />
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Temporary password" required />
        <select name="role" className="h-9 rounded-xl border border-input bg-input/30 px-3 text-sm">
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <Button type="submit">Create user</Button>
      </form>
      <div className="overflow-x-auto rounded-2xl glass-panel">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.04] text-left text-muted-foreground"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Update</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-3">{user.full_name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3"><StatusBadge value={user.role} /></td>
                <td className="px-4 py-3">{user.is_active ? "Active" : "Inactive"}</td>
                <td className="px-4 py-3">
                  <form action={updateUserRoleAction} className="flex gap-2">
                    <input type="hidden" name="id" value={user.id} />
                    <input type="hidden" name="full_name" value={user.full_name} />
                    <select name="role" defaultValue={user.role} className="h-9 rounded-xl border border-input bg-input/30 px-2 text-sm">
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <select name="is_active" defaultValue={String(user.is_active)} className="h-9 rounded-xl border border-input bg-input/30 px-2 text-sm">
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                    <Button type="submit" size="sm" variant="outline">Save</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
