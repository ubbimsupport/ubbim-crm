import { Inter } from "next/font/google";
import { ContractorHeader } from "@/components/layout/contractor-header";
import { ContractorSidebar } from "@/components/layout/contractor-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { requireProfile } from "@/lib/auth";
import { getContractorContext } from "@/lib/contractor";
import { homePathForRole, isPortalRole } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types";
import { redirect } from "next/navigation";

const complianceSans = Inter({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (!isPortalRole(profile.role)) redirect(homePathForRole(profile.role));

  if (profile.role === "contractor") {
    const { profile: contractorProfile, company, contractor } = await getContractorContext();
    const supabase = await createClient();
    const { data } = await supabase
      .from("crm_notifications")
      .select("*")
      .eq("user_id", contractorProfile.id)
      .order("created_at", { ascending: false })
      .limit(12);
    const notifications = (data ?? []) as Notification[];
    const unreadCount = notifications.filter((item) => !item.is_read).length;
    return (
      <div className={`${complianceSans.className} flex min-h-screen w-full bg-[#f4f6f8]`}>
        <ContractorSidebar
          profile={contractorProfile}
          companyName={company?.company_name ?? null}
          cidbGrade={contractor?.cidb_grade ?? null}
        />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-y-auto">
          <ContractorHeader
            profile={contractorProfile}
            companyName={company?.company_name ?? null}
            companyStatus={company?.status ?? null}
            cidbGrade={contractor?.cidb_grade ?? null}
            notifications={notifications}
            unreadCount={unreadCount}
          />
          <main className="flex-1 px-4 pb-8 pt-2 lg:px-8">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar role={profile.role} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-y-auto bg-slate-50">
        <AppHeader profile={profile} notifications={[]} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
