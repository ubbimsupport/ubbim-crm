"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { getContractorDocumentUrlAction, uploadContractorDocumentAction, type ContractorFormState } from "@/lib/actions/contractor";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { documentDisplayStatus } from "@/lib/document-status";
import { formatDate } from "@/lib/format";
import type { CrmDocument, DocumentType } from "@/lib/types";

const initial: ContractorFormState = {};

export function ContractorDocumentsClient({
  documents,
  types,
}: {
  documents: CrmDocument[];
  types: DocumentType[];
}) {
  const [state, action, pending] = useActionState(uploadContractorDocumentAction, initial);
  const [replaceId, setReplaceId] = useState<string | null>(null);

  async function download(id: string) {
    const result = await getContractorDocumentUrlAction(id);
    if (result.error || !result.url) {
      toast.error(result.error || "Download failed");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-6">
      <form action={action} className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2">
        <input type="hidden" name="document_id" value={replaceId ?? ""} />
        <h2 className="text-lg font-semibold text-primary md:col-span-2">
          {replaceId ? "Replace document" : "Upload document"}
        </h2>
        {state.error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-800 md:col-span-2">{state.error}</p> : null}
        {state.ok ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 md:col-span-2">{state.message}</p> : null}
        <div className="space-y-2">
          <Label>Document Type</Label>
          <select name="document_type_id" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Select</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="document_name">Document Name</Label>
          <Input id="document_name" name="document_name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="issue_date">Issue Date</Label>
          <Input id="issue_date" name="issue_date" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiry_date">Expiry Date</Label>
          <Input id="expiry_date" name="expiry_date" type="date" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="file">File (PDF, Word, JPEG, PNG, WebP · max 10MB)</Label>
          <Input id="file" name="file" type="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" />
        </div>
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit" disabled={pending}>{pending ? "Uploading..." : replaceId ? "Replace file" : "Upload"}</Button>
          {replaceId ? (
            <Button type="button" variant="outline" onClick={() => setReplaceId(null)}>Cancel replace</Button>
          ) : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              {["Document Name", "Document Type", "Issue Date", "Expiry Date", "Status", "Uploaded Date", "Action"].map((h) => (
                <th key={h} className="px-3 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-t">
                <td className="px-3 py-2 font-medium">{doc.document_name}</td>
                <td className="px-3 py-2">{doc.document_type?.name || "—"}</td>
                <td className="px-3 py-2">{formatDate(doc.issue_date)}</td>
                <td className="px-3 py-2">{formatDate(doc.expiry_date)}</td>
                <td className="px-3 py-2"><StatusBadge value={documentDisplayStatus(doc)} /></td>
                <td className="px-3 py-2">{formatDate(doc.uploaded_at)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => download(doc.id)}>Download</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setReplaceId(doc.id)}>Replace</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}