import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Contact } from "@/lib/types";
import Link from "next/link";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireProfile();
  const { q } = await searchParams;
  const supabase = await createClient();
  let request = supabase.from("crm_contacts").select("*, company:crm_companies(id, company_name, company_code, company_kind)").order("created_at", { ascending: false });
  if (q) request = request.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data } = await request;
  const contacts = (data ?? []) as Contact[];
  return (
    <div>
      <PageHeader title="Contacts" description="Company contacts across vendors and contractors." />
      <form className="mb-4"><input name="q" defaultValue={q} placeholder="Search contacts" className="h-8 w-full max-w-sm rounded-md border px-3 text-sm" /></form>
      {contacts.length === 0 ? <EmptyState title="No contacts" description="Add contacts from a company profile." /> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Position</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">WhatsApp</th></tr></thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{c.full_name}{c.is_primary ? " · Primary" : ""}</td>
                  <td className="px-3 py-2"><Link className="text-primary hover:underline" href={`/${c.company?.company_kind}s/${c.company_id}`}>{c.company?.company_name}</Link></td>
                  <td className="px-3 py-2">{c.position}</td>
                  <td className="px-3 py-2">{c.phone}</td>
                  <td className="px-3 py-2">{c.email}</td>
                  <td className="px-3 py-2">{c.whatsapp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
