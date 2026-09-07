"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, Sparkles } from "lucide-react";
import { signOutAction } from "@/lib/actions/crm";
import { companyRegistryLabel, displayInitials } from "@/lib/compliance-display";
import type { CompanyStatus, Notification, Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ContractorSidebar } from "@/components/layout/contractor-sidebar";
import { formatRelative } from "@/lib/format";

export function ContractorHeader({
  profile,
  companyName,
  companyStatus,
  cidbGrade,
  notifications,
  unreadCount,
}: {
  profile: Profile;
  companyName?: string | null;
  companyStatus?: CompanyStatus | null;
  cidbGrade?: string | null;
  notifications: Notification[];
  unreadCount: number;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/contractor/dashboard";
  const companyInitials = displayInitials(companyName);
  const registryLabel = companyRegistryLabel(companyStatus);

  return (
    <header className={isDashboard ? "px-4 pb-2 pt-5 lg:px-8" : "border-b border-slate-200/80 px-4 py-3 lg:px-8"}>
      <div className={isDashboard ? "flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between" : "flex items-center justify-between gap-3"}>
        <div className="flex items-start gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className={`${isDashboard ? "mt-1" : ""} border-slate-200 bg-white lg:hidden`}>
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 p-0">
              <ContractorSidebar
                className="flex h-full min-h-full"
                profile={profile}
                companyName={companyName}
                cidbGrade={cidbGrade}
              />
            </SheetContent>
          </Sheet>
          {isDashboard ? (
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[32px]">
                  Malaysian CIDB &amp; HRDF Compliance Tracker
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-sm">
                  <Sparkles className="size-3.5 text-violet-500" />
                  <span className="bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">
                    AI Engine Live
                  </span>
                </span>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Real-time regulatory dashboard for CIDB Contractor Grades, Kad Hijau Personnel &amp; HRD Corp levies.
              </p>
            </div>
          ) : (
            <div className="hidden min-w-0 sm:block">
              <div className="text-sm font-semibold text-slate-900">Compliance tracker</div>
              <div className="text-xs text-slate-400">CIDB, HRDF &amp; contractor portal</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative bg-white" aria-label="Notifications">
                <Bell className="size-4 text-slate-500" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">No unread notifications</div>
              ) : (
                notifications.slice(0, 8).map((item) => (
                  <DropdownMenuItem key={item.id} asChild>
                    <Link href={item.link || "/contractor/notifications"}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">{formatRelative(item.created_at)}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/contractor/notifications">View all</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {companyName ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div>
                <div className="text-sm font-semibold text-slate-900">{companyName}</div>
                {registryLabel ? (
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span
                      className={
                        companyStatus === "active"
                          ? "size-1.5 rounded-full bg-emerald-500"
                          : "size-1.5 rounded-full bg-amber-400"
                      }
                    />
                    {registryLabel}
                  </div>
                ) : null}
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {companyInitials || "—"}
              </div>
            </div>
          ) : null}

          <form action={signOutAction}>
            <input type="hidden" name="portal" value="contractor" />
            <Button
              type="submit"
              variant="outline"
              className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-4 text-slate-700 shadow-sm"
            >
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
