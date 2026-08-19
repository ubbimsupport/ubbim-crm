import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { requireProfile } from "@/lib/auth";
import { DOCUMENT_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { CrmDocument } from "@/lib/types";
import Link from "next/link";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireProfile();
  const query = await searchParams;
  const supabase = await createClient();
  let request = supabase.from("crm_documents").select("*, company:crm_companies(id, company_name, company_code, company_kind), document_type:crm_document_types(name)").order("expiry_date", { ascending: true, nullsFirst: false });
  if (query.status) request = request.eq("status", query.status);
  if (query.q) request = request.ilike("document_name", `%${query.q}%`);
  const { data } = await request;
  const documents = (data ?? []) as CrmDocument[];
  return (
    <div>
      <PageHeader title="Documents" description="Central document register with automatic expiry status." />
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={query.q} placeholder="Search documents" className="h-8 rounded-md border px-3 text-sm" />
        <select name="status" defaultValue={query.status ?? ""} className="h-8 rounded-md border px-3 text-sm">
          <option value="">All statuses</option>
          {DOCUMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button className="h-8 rounded-md border px-3 text-sm">Filter</button>
      </form>
      {documents.length === 0 ? <EmptyState title="No documents" description="Upload documents from a company profile." /> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Expiry</th><th className="px-3 py-2">Status</th></tr></thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{d.document_code}</td>
                  <td className="px-3 py-2">{d.document_name}</td>
                  <td className="px-3 py-2"><Link className="text-primary hover:underline" href={`/${d.company?.company_kind}s/${d.company_id}`}>{d.company?.company_name}</Link></td>
                  <td className="px-3 py-2">{d.document_type?.name}</td>
                  <td className="px-3 py-2">{formatDate(d.expiry_date)}</td>
                  <td className="px-3 py-2"><StatusBadge value={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
