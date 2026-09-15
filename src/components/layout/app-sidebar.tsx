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
import type { CompanyKind, UserRole } from "@/lib/types";
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

export function AppSidebar({
  role,
  companyKind,
  className,
}: {
  role: UserRole;
  companyKind?: CompanyKind | null;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <aside
      className={cn(
        "flex h-screen min-h-screen w-56 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground",
        className ?? "sticky top-0 hidden lg:flex",
      )}
    >
      <div className="flex h-12 items-center gap-2 border-b px-3">
        <div className="flex size-7 items-center justify-center rounded border bg-muted text-xs font-semibold">
          U
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">UBBIM CRM</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV_ITEMS.filter((item) => canAccessPath(role, item.href, companyKind)).map((item) => {
          const Icon = icons[item.icon];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1.5 text-sm",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
