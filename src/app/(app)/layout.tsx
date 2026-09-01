import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types";
import { homePathForRole, isPortalRole } from "@/lib/rbac";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (isPortalRole(profile.role)) redirect(homePathForRole(profile.role));
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar role={profile.role} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-y-auto bg-slate-50">
        <AppHeader profile={profile} notifications={(data ?? []) as Notification[]} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
