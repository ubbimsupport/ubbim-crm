import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { requireProfile } from "@/lib/auth";
import { homePathForRole, isPortalRole } from "@/lib/rbac";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (!isPortalRole(profile.role)) redirect(homePathForRole(profile.role));

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role={profile.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader profile={profile} notifications={[]} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
