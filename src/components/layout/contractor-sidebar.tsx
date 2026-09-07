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
        "flex w-64 min-h-screen shrink-0 flex-col bg-[#0b253a] text-sidebar-foreground",
        className ?? "hidden lg:flex",
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary font-bold text-sidebar-primary-foreground">
          U
        </div>
        <div>
          <div className="text-[11px] font-semibold tracking-[0.2em] text-sidebar-primary">UBBIM</div>
          <div className="text-sm font-semibold">Contractor Portal</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {CONTRACTOR_NAV_ITEMS.map((item) => {
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
      <form action={signOutAction} className="border-t border-sidebar-border p-3">
        <input type="hidden" name="portal" value="contractor" />
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
        >
          <LogOut className="size-4" />
          Logout
        </Button>
      </form>
    </aside>
  );
}