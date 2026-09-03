"use client";

import { toast } from "sonner";
import { getStaffDocumentUrlAction, reviewContractorDocumentAction } from "@/lib/actions/contractor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StaffDocumentActions({
  documentId,
  companyId,
  filePath,
}: {
  documentId: string;
  companyId: string;
  filePath?: string | null;
}) {
  async function download() {
    const result = await getStaffDocumentUrlAction(documentId);
    if (result.error || !result.url) {
      toast.error(result.error || "Download failed");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filePath ? (
        <Button type="button" size="sm" variant="outline" onClick={download}>Download</Button>
      ) : null}
      <form action={reviewContractorDocumentAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="id" value={documentId} />
        <input type="hidden" name="company_id" value={companyId} />
        <input type="hidden" name="decision" value="approved" />
        <Button type="submit" size="sm">Approve</Button>
      </form>
      <form action={reviewContractorDocumentAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="id" value={documentId} />
        <input type="hidden" name="company_id" value={companyId} />
        <input type="hidden" name="decision" value="rejected" />
        <Input name="reason" placeholder="Rejection reason" className="h-8 w-48" required />
        <Button type="submit" size="sm" variant="destructive">Reject</Button>
      </form>
    </div>
  );
}