import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { requireProfile, resolveHomePath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types";
import { isPortalRole } from "@/lib/rbac";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (isPortalRole(profile.role)) redirect(await resolveHomePath(profile));
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar role={profile.role} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-transparent">
        <AppHeader profile={profile} notifications={(data ?? []) as Notification[]} />
        <main className="flex-1 space-y-4 bg-background p-4">{children}</main>
      </div>
    </div>
  );
}
