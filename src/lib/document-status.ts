import type { CrmDocument } from "@/lib/types";

export function documentDisplayStatus(doc: Pick<CrmDocument, "review_status" | "status">) {
  if (doc.review_status === "pending_review") return "pending_review";
  if (doc.review_status === "rejected") return "rejected";
  return doc.status;
}
