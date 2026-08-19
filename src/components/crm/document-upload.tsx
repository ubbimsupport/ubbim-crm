"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { DocumentType } from "@/lib/types";

export function DocumentUpload({
  companyId,
  documentTypes,
}: {
  companyId: string;
  documentTypes: DocumentType[];
}) {
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) {
      toast.error("Choose a file to upload.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const { data: inserted, error } = await supabase.from("crm_documents").insert({
        company_id: companyId,
        document_type_id: String(data.get("document_type_id") || "") || null,
        document_name: String(data.get("document_name") || file.name),
        document_number: String(data.get("document_number") || "") || null,
        issue_date: String(data.get("issue_date") || "") || null,
        expiry_date: String(data.get("expiry_date") || "") || null,
        remarks: String(data.get("remarks") || "") || null,
        uploaded_by: userData.user?.id ?? null,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
      }).select("id").single();
      if (error || !inserted) throw new Error(error?.message || "Unable to create document");
      const path = `${companyId}/${inserted.id}/${file.name}`;
      const upload = await supabase.storage.from("crm-documents").upload(path, file, { upsert: true });
      if (upload.error) throw new Error(upload.error.message);
      await supabase.from("crm_documents").update({ file_path: path }).eq("id", inserted.id);
      toast.success("Document uploaded.");
      form.reset();
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-2 rounded-lg border p-4 md:grid-cols-3">
      <Input name="document_name" placeholder="Document name" required />
      <select name="document_type_id" className="h-8 rounded-md border bg-background px-3 text-sm">
        <option value="">Type</option>
        {documentTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <Input name="document_number" placeholder="Document number" />
      <Input name="issue_date" type="date" />
      <Input name="expiry_date" type="date" />
      <Input name="file" type="file" required />
      <Input name="remarks" placeholder="Remarks" className="md:col-span-2" />
      <Button type="submit" disabled={busy}>{busy ? "Uploading..." : "Upload document"}</Button>
    </form>
  );
}
