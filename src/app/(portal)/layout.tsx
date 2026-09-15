import { ContractorHeader } from "@/components/layout/contractor-header";
import { ContractorSidebar } from "@/components/layout/contractor-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { requireProfile } from "@/lib/auth";
import { homePathForRole, isPortalRole } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (!isPortalRole(profile.role)) redirect(homePathForRole(profile.role));

  if (profile.role === "contractor") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("crm_notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(12);
    const notifications = (data ?? []) as Notification[];
    const unreadCount = notifications.filter((item) => !item.is_read).length;
    return (
      <div className="flex h-screen w-full overflow-hidden">
        <ContractorSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-transparent">
          <ContractorHeader profile={profile} notifications={notifications} unreadCount={unreadCount} />
          <main className="flex-1 space-y-6 p-5 lg:p-8">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar role={profile.role} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-transparent">
        <AppHeader profile={profile} notifications={[]} />
        <main className="flex-1 space-y-6 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}