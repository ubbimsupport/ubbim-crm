"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  Building2,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  FileStack,
  FolderKanban,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/crm";
import { displayInitials } from "@/lib/compliance-display";
import { COMPLIANCE_NAV_ITEMS, CONTRACTOR_NAV_ITEMS } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const icons = {
  LayoutDashboard,
  Briefcase,
  CircleDollarSign,
  Gauge,
  CalendarClock,
  Users,
  GraduationCap,
  Building2,
  FileStack,
  FolderKanban,
  CreditCard,
  ListTodo,
  Bell,
  LifeBuoy,
  Settings,
};

function navActive(pathname: string, href: string) {
  const [path] = href.split("#");
  if (path === "/contractor/dashboard") {
    return pathname === "/contractor/dashboard";
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function ContractorSidebar({
  className,
  profile,
  companyName,
  cidbGrade,
}: {
  className?: string;
  profile: Profile;
  companyName?: string | null;
  cidbGrade?: string | null;
}) {
  const pathname = usePathname();
  const initials = displayInitials(profile.full_name || profile.email);

  return (
    <aside
      className={cn(
        "flex w-72 min-h-screen shrink-0 flex-col border-r border-slate-200 bg-white text-slate-700",
        className ?? "hidden lg:flex",
      )}
    >
      <div className="flex items-center gap-3 px-5 pb-2 pt-6">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-sm">
          <Briefcase className="size-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-bold uppercase tracking-[0.14em] text-slate-900">Compliance</div>
          {companyName ? (
            <div className="line-clamp-2 text-[11px] font-medium uppercase leading-4 tracking-[0.12em] text-sky-500">
              {companyName}
            </div>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
        <div className="space-y-1">
          {COMPLIANCE_NAV_ITEMS.map((item) => {
            const Icon = icons[item.icon];
            const active = navActive(pathname, item.href);
            const label =
              item.href.includes("cidb-license") && cidbGrade
                ? `CIDB ${cidbGrade} License`
                : item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors",
                  active
                    ? "bg-[#e8f1ff] font-semibold text-[#1d4ed8]"
                    : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                )}
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>

        <div>
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Contractor portal
          </div>
          <div className="space-y-1">
            {CONTRACTOR_NAV_ITEMS.filter((item) => item.href !== "/contractor/dashboard").map((item) => {
              const Icon = icons[item.icon];
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors",
                    active
                      ? "bg-[#e8f1ff] font-semibold text-[#1d4ed8]"
                      : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                  )}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="mt-auto border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="size-10 bg-[#dbeafe] text-[#1d4ed8]">
            {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
            <AvatarFallback className="bg-[#dbeafe] text-[11px] font-semibold tracking-wide text-[#1d4ed8]">
              {initials || "—"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900">
              {profile.full_name || profile.email}
            </div>
            <div className="truncate text-xs text-slate-400">{profile.email}</div>
          </div>
          <form action={signOutAction}>
            <input type="hidden" name="portal" value="contractor" />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="size-8 text-slate-400 hover:text-slate-700"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
