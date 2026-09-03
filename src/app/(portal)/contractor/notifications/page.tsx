import {
  deleteContractorNotificationAction,
  markAllContractorNotificationsReadAction,
  markContractorNotificationReadAction,
} from "@/lib/actions/contractor";
import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types";
import Link from "next/link";

export default async function ContractorNotificationsPage() {
  const profile = await requireRole(["contractor"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });
  const notifications = (data ?? []) as Notification[];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        actions={
          <form action={markAllContractorNotificationsReadAction}>
            <Button type="submit" variant="outline">Mark all as read</Button>
          </form>
        }
      />
      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="Approvals, document reviews, payments, and support updates will appear here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => (
            <div key={item.id} className={`rounded-lg border p-4 ${item.is_read ? "bg-card" : "bg-sky-50"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link href={item.link || "/contractor/notifications"} className="min-w-0 flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.body}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge value={item.type} />
                    <span>{formatDateTime(item.created_at)}</span>
                    <span>{item.is_read ? "Read" : "Unread"}</span>
                  </div>
                </Link>
                <div className="flex gap-2">
                  {!item.is_read ? (
                    <form action={markContractorNotificationReadAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button type="submit" size="sm" variant="outline">Mark as read</Button>
                    </form>
                  ) : null}
                  <form action={deleteContractorNotificationAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" size="sm" variant="ghost">Delete</Button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}