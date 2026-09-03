import Link from "next/link";
import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { SupportTicket } from "@/lib/types";

export default async function StaffTicketsPage() {
  await requireRole(["super_admin", "admin", "staff"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_contractor_support_tickets")
    .select("*, company:crm_companies(id, company_name, company_code)")
    .order("created_at", { ascending: false });
  const tickets = (data ?? []) as SupportTicket[];
  return (
    <div className="space-y-6">
      <PageHeader title="Support tickets" description="Contractor portal tickets. Reply from the ticket conversation." />
      {tickets.length === 0 ? (
        <EmptyState title="No contractor tickets" description="Tickets created in the contractor portal will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                {["Ticket", "Company", "Subject", "Priority", "Status", "Updated"].map((h) => (
                  <th key={h} className="px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-t">
                  <td className="px-3 py-2">
                    <Link href={`/tickets/${ticket.id}`} className="font-mono text-xs text-primary hover:underline">
                      {ticket.ticket_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{ticket.company?.company_name}</td>
                  <td className="px-3 py-2">{ticket.subject}</td>
                  <td className="px-3 py-2"><StatusBadge value={ticket.priority} /></td>
                  <td className="px-3 py-2"><StatusBadge value={ticket.status} /></td>
                  <td className="px-3 py-2">{formatDateTime(ticket.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}