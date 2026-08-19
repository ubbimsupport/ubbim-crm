import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/crm/empty-state";
import { PageHeader } from "@/components/crm/page-header";
import { StatusBadge } from "@/components/crm/status-badge";
import { COMPANY_STATUSES, MALAYSIAN_STATES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { canManageCompanies } from "@/lib/rbac";
import type { Company, CompanyKind, UserRole } from "@/lib/types";

export function CompanyDirectory({
  kind,
  companies,
  role,
  query,
}: {
  kind: CompanyKind;
  companies: Company[];
  role: UserRole;
  query: { q?: string; status?: string; state?: string; sort?: string };
}) {
  const title = kind === "vendor" ? "Vendors" : "Contractors";
  const base = `/${kind}s`;
  return (
    <div>
      <PageHeader
        title={title}
        description={`Search, filter, and manage UBBIM ${title.toLowerCase()}.`}
        actions={
          canManageCompanies(role) ? (
            <Button asChild>
              <Link href={`${base}/new`}>Add {kind}</Link>
            </Button>
          ) : null
        }
      />
      <form className="mb-4 grid gap-2 md:grid-cols-4">
        <Input name="q" placeholder="Search name, ID, registration, email" defaultValue={query.q} />
        <select name="status" defaultValue={query.status ?? ""} className="h-8 rounded-md border bg-background px-3 text-sm">
          <option value="">All statuses</option>
          {COMPANY_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select name="state" defaultValue={query.state ?? ""} className="h-8 rounded-md border bg-background px-3 text-sm">
          <option value="">All states</option>
          {MALAYSIAN_STATES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <Button type="submit" variant="outline">Apply filters</Button>
      </form>
      {companies.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()} found`} description="Adjust filters or register a new company." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Registration</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">State</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Expiry</th>
                <th className="px-3 py-2">Rating</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((item) => (
                <tr key={item.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link href={`${base}/${item.id}`} className="text-primary hover:underline">{item.company_code}</Link>
                  </td>
                  <td className="px-3 py-2 font-medium">{item.company_name}</td>
                  <td className="px-3 py-2">{item.registration_number || "—"}</td>
                  <td className="px-3 py-2">{item.contact_person}<div className="text-xs text-muted-foreground">{item.email}</div></td>
                  <td className="px-3 py-2">{item.state || "—"}</td>
                  <td className="px-3 py-2"><StatusBadge value={item.status} /></td>
                  <td className="px-3 py-2">{formatDate(item.expiry_date)}</td>
                  <td className="px-3 py-2">{item.rating ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
