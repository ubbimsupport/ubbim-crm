"use client";

import { useActionState } from "react";
import { createSupportTicketAction, type ContractorFormState } from "@/lib/actions/contractor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_CATEGORIES, SUPPORT_PRIORITIES } from "@/lib/constants";

const initial: ContractorFormState = {};

export function CreateTicketForm() {
  const [state, action, pending] = useActionState(createSupportTicketAction, initial);
  return (
    <form action={action} className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2">
      {state.error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-800 md:col-span-2">{state.error}</p> : null}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <select name="category" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
          {SUPPORT_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Priority</Label>
        <select name="priority" defaultValue="medium" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
          {SUPPORT_PRIORITIES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="file">Attachment (optional)</Label>
        <Input id="file" name="file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create ticket"}</Button>
      </div>
    </form>
  );
}