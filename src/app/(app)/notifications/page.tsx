import { markNotificationsReadAction } from "@/lib/actions/crm";
import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types";
import Link from "next/link";

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("crm_notifications").select("*").eq("user_id", profile.id).order("created_at", { ascending: false });
  const notifications = (data ?? []) as Notification[];
  return (
    <div>
      <PageHeader title="Notifications" actions={<form action={markNotificationsReadAction}><Button type="submit" variant="outline">Mark all read</Button></form>} />
      {notifications.length === 0 ? <EmptyState title="No notifications" description="Approvals, expiries, and payments will appear here." /> : (
        <div className="space-y-2">
          {notifications.map((item) => (
            <Link key={item.id} href={item.link || "/notifications"} className={`block rounded-lg border p-4 ${item.is_read ? "bg-card" : "bg-sky-50"}`}>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-muted-foreground">{item.body}</div>
              <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
