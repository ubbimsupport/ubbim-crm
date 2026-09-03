import { notFound } from "next/navigation";
import { TicketThread } from "@/components/contractor/ticket-thread";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import { updateSupportTicketStatusAction } from "@/lib/actions/contractor";
import { requireRole } from "@/lib/auth";
import { SUPPORT_STATUSES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { SupportMessage, SupportTicket } from "@/lib/types";

export default async function StaffTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["super_admin", "admin", "staff"]);
  const { id } = await params;
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("crm_contractor_support_tickets")
    .select("*, company:crm_companies(id, company_name, company_code)")
    .eq("id", id)
    .maybeSingle();
  if (!ticket) notFound();
  const { data: messages } = await supabase
    .from("crm_contractor_support_messages")
    .select("*, author:crm_profiles(id, full_name, email, role)")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });
  const record = ticket as SupportTicket;
  return (
    <div className="space-y-6">
      <PageHeader
        title={record.ticket_number}
        description={`${record.subject} · ${record.company?.company_name || "Contractor"}`}
      />
      <form action={updateSupportTicketStatusAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="ticket_id" value={record.id} />
        <select name="status" defaultValue={record.status} className="h-8 rounded-md border px-3 text-sm">
          {SUPPORT_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
        <Button type="submit" variant="outline">Update status</Button>
      </form>
      <div className="flex gap-2">
        <StatusBadge value={record.status} />
        <StatusBadge value={record.priority} />
      </div>
      <TicketThread ticket={record} messages={(messages ?? []) as SupportMessage[]} canClose />
    </div>
  );
}