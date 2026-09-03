"use client";

import { useActionState } from "react";
import { closeSupportTicketAction, replySupportTicketAction, type ContractorFormState } from "@/lib/actions/contractor";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import type { SupportMessage, SupportTicket } from "@/lib/types";

const initial: ContractorFormState = {};

export function TicketThread({
  ticket,
  messages,
  canClose,
}: {
  ticket: SupportTicket;
  messages: SupportMessage[];
  canClose: boolean;
}) {
  const [state, action, pending] = useActionState(replySupportTicketAction, initial);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <StatusBadge value={ticket.status} />
        <StatusBadge value={ticket.priority} />
        <StatusBadge value={ticket.category} />
      </div>
      <div className="space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="rounded-xl border bg-card p-4">
            <div className="text-xs text-muted-foreground">
              {message.author?.full_name || "UBBIM"} · {formatDateTime(message.created_at)}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>
            {message.attachment_name ? (
              <p className="mt-2 text-xs text-muted-foreground">Attachment: {message.attachment_name}</p>
            ) : null}
          </div>
        ))}
      </div>
      {ticket.status !== "closed" ? (
        <form action={action} className="space-y-3 rounded-xl border bg-card p-4">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          {state.error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{state.error}</p> : null}
          {state.ok ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p> : null}
          <Textarea name="body" placeholder="Write a reply" required />
          <input name="file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" />
          <Button type="submit" disabled={pending}>{pending ? "Sending..." : "Reply"}</Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">This ticket is closed.</p>
      )}
      {canClose && ticket.status !== "closed" ? (
        <form action={closeSupportTicketAction}>
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <Button type="submit" variant="outline">Close ticket</Button>
        </form>
      ) : null}
    </div>
  );
}