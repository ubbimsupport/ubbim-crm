import { ContractorDocumentsClient } from "./documents-client";
import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { getContractorContext } from "@/lib/contractor";
import { createClient } from "@/lib/supabase/server";
import type { CrmDocument, DocumentType } from "@/lib/types";

export default async function ContractorDocumentsPage() {
  const { company } = await getContractorContext();
  if (!company) {
    return (
      <div>
        <PageHeader title="Documents" />
        <EmptyState title="No company profile" description="Link a company before uploading documents." />
      </div>
    );
  }
  const supabase = await createClient();
  const [{ data: documents }, { data: types }] = await Promise.all([
    supabase
      .from("crm_documents")
      .select("*, document_type:crm_document_types(*)")
      .eq("company_id", company.id)
      .order("uploaded_at", { ascending: false }),
    supabase.from("crm_document_types").select("*").eq("is_active", true).order("name"),
  ]);
  const rows = (documents ?? []) as CrmDocument[];
  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Upload and manage certificates for your company. New files are sent for UBBIM review." />
      {rows.length === 0 ? (
        <EmptyState title="No documents uploaded yet." description="Upload CIDB, SSM, insurance, licenses, or other certificates." />
      ) : null}
      <ContractorDocumentsClient documents={rows} types={(types ?? []) as DocumentType[]} />
    </div>
  );
}