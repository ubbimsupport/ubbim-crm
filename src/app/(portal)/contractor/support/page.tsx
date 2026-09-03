import Link from "next/link";
import { CreateTicketForm } from "./create-ticket-form";
import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { getContractorContext } from "@/lib/contractor";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { SupportTicket } from "@/lib/types";

export default async function ContractorSupportPage() {
  const { company } = await getContractorContext();
  if (!company) {
    return (
      <div>
        <PageHeader title="Support" />
        <EmptyState title="No company profile" description="Support tickets are linked to your company." />
      </div>
    );
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_contractor_support_tickets")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });
  const tickets = (data ?? []) as SupportTicket[];
  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Create and follow tickets with the UBBIM team." />
      <CreateTicketForm />
      {tickets.length === 0 ? (
        <EmptyState title="No support tickets yet." description="Open a ticket if you need help with your account, documents, payments, or projects." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                {["Ticket Number", "Subject", "Category", "Priority", "Status", "Created Date", "Updated Date"].map((h) => (
                  <th key={h} className="px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-t">
                  <td className="px-3 py-2">
                    <Link href={`/contractor/support/${ticket.id}`} className="font-mono text-xs text-primary hover:underline">
                      {ticket.ticket_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{ticket.subject}</td>
                  <td className="px-3 py-2"><StatusBadge value={ticket.category} /></td>
                  <td className="px-3 py-2"><StatusBadge value={ticket.priority} /></td>
                  <td className="px-3 py-2"><StatusBadge value={ticket.status} /></td>
                  <td className="px-3 py-2">{formatDateTime(ticket.created_at)}</td>
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