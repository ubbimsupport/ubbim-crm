"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  CreditCard,
  FileStack,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  LogOut,
  Settings,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/crm";
import { CONTRACTOR_NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const icons = {
  LayoutDashboard,
  Building2,
  FileStack,
  FolderKanban,
  CreditCard,
  ListTodo,
  Bell,
  LifeBuoy,
  Settings,
};

export function ContractorSidebar({ className }: { className?: string }) {
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
          <div className="truncate text-sm font-semibold">Contractor Portal</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {CONTRACTOR_NAV_ITEMS.map((item) => {
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
      <form action={signOutAction} className="border-t p-2">
        <input type="hidden" name="portal" value="contractor" />
        <Button type="submit" variant="ghost" className="w-full justify-start gap-2">
          <LogOut className="size-4" />
          Logout
        </Button>
      </form>
    </aside>
  );
}
