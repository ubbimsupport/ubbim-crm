"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  FileStack,
  FolderKanban,
  HardHat,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  ScrollText,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { canAccessPath } from "@/lib/rbac";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons = {
  LayoutDashboard,
  Building2,
  HardHat,
  Users,
  FolderKanban,
  FileStack,
  LifeBuoy,
  ListTodo,
  CreditCard,
  Bell,
  BarChart3,
  Shield,
  ScrollText,
  Settings,
};

export function AppSidebar({ role, className }: { role: UserRole; className?: string }) {
  const pathname = usePathname();
  return (
    <aside
      className={cn(
        "flex h-screen min-h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className ?? "sticky top-0 hidden lg:flex",
      )}
    >
      <div className="flex h-[4.25rem] items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold tracking-wide">
          U
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">UBBIM</div>
          <div className="truncate text-sm font-semibold">Corporate CRM</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV_ITEMS.filter((item) => canAccessPath(role, item.href)).map((item) => {
          const Icon = icons[item.icon];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150",
                active
                  ? "bg-white/10 font-medium text-white"
                  : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
