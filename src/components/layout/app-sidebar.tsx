"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  FileText,
  FolderKanban,
  HardHat,
  LayoutDashboard,
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
  FileText,
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
    <aside className={cn("flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground", className ?? "hidden lg:flex")}>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary font-bold text-sidebar-primary-foreground">
          U
        </div>
        <div>
          <div className="text-[11px] font-semibold tracking-[0.2em] text-sidebar-primary">UBBIM</div>
          <div className="text-sm font-semibold">Corporate CRM</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.filter((item) => canAccessPath(role, item.href)).map((item) => {
          const Icon = icons[item.icon];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
