import { notFound } from "next/navigation";
import { TicketThread } from "@/components/contractor/ticket-thread";
import { PageHeader } from "@/components/crm/page-header";
import { getContractorContext } from "@/lib/contractor";
import { createClient } from "@/lib/supabase/server";
import type { SupportMessage, SupportTicket } from "@/lib/types";

export default async function ContractorTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await getContractorContext();
  if (!company) notFound();
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("crm_contractor_support_tickets")
    .select("*")
    .eq("id", id)
    .eq("company_id", company.id)
    .maybeSingle();
  if (!ticket) notFound();
  const { data: messages } = await supabase
    .from("crm_contractor_support_messages")
    .select("*, author:crm_profiles(id, full_name, email, role)")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });
  return (
    <div className="space-y-6">
      <PageHeader title={(ticket as SupportTicket).ticket_number} description={(ticket as SupportTicket).subject} />
      <TicketThread ticket={ticket as SupportTicket} messages={(messages ?? []) as SupportMessage[]} canClose />
    </div>
  );
}