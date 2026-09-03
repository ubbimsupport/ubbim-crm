"use client";

import Link from "next/link";
import { Bell, LogOut, Menu } from "lucide-react";
import { signOutAction } from "@/lib/actions/crm";
import { roleLabel } from "@/lib/rbac";
import type { Notification, Profile } from "@/lib/types";
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
  notifications,
  unreadCount,
}: {
  profile: Profile;
  notifications: Notification[];
  unreadCount: number;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-0 p-0">
            <ContractorSidebar className="flex h-full min-h-full" />
          </SheetContent>
        </Sheet>
        <div className="hidden text-sm text-muted-foreground sm:block">UBBIM Contractor Portal</div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4" />
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
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium">{profile.full_name || profile.email}</div>
          <div className="text-xs text-muted-foreground">{roleLabel(profile.role)}</div>
        </div>
        <form action={signOutAction}>
          <input type="hidden" name="portal" value="contractor" />
          <Button variant="outline" size="icon" type="submit" aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}