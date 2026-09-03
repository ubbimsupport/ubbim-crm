import Link from "next/link";
import {
  assignStaffAction,
  saveActivityAction,
  saveContactAction,
  saveNoteAction,
  updateCompanyStatusAction,
} from "@/lib/actions/crm";
import { DeleteVendorButton } from "@/components/crm/delete-vendor-button";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { canManageCompanies, canWriteRecords, isReadOnly } from "@/lib/rbac";
import type {
  Activity,
  AuditLog,
  Company,
  CompanyKind,
  Contact,
  Note,
  Payment,
  Profile,
  Project,
} from "@/lib/types";

export function CompanyProfile({
  kind,
  company,
  contacts,
  projects,
  activities,
  payments,
  notes,
  audit,
  staff,
  profile,
}: {
  kind: CompanyKind;
  company: Company;
  contacts: Contact[];
  projects: Project[];
  activities: Activity[];
  payments: Payment[];
  notes: Note[];
  audit: AuditLog[];
  staff: Profile[];
  profile: Profile;
}) {
  const writable = canWriteRecords(profile.role);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs tracking-[0.2em] text-amber-700">{company.company_code}</div>
          <h1 className="text-2xl font-semibold text-primary">{company.company_name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge value={company.status} />
            <StatusBadge value={company.company_kind} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {writable ? (
            <Button asChild variant="outline">
              <Link href={`/${kind}s/${company.id}/edit`}>Edit</Link>
            </Button>
          ) : null}
          {canManageCompanies(profile.role) ? (
            <>
              <form action={updateCompanyStatusAction}>
                <input type="hidden" name="id" value={company.id} />
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="status" value="active" />
                <Button type="submit">Approve</Button>
              </form>
              <form action={updateCompanyStatusAction}>
                <input type="hidden" name="id" value={company.id} />
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="status" value="rejected" />
                <Button type="submit" variant="destructive">Reject</Button>
              </form>
              <form action={updateCompanyStatusAction}>
                <input type="hidden" name="id" value={company.id} />
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="status" value="inactive" />
                <Button type="submit" variant="outline">Deactivate</Button>
              </form>
              <DeleteVendorButton id={company.id} name={company.company_name} />
            </>
          ) : null}
        </div>
      </div>
      <Tabs defaultValue="overview">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="audit">Audit History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="grid gap-4 md:grid-cols-2">
          <Info label="Registration number" value={company.registration_number} />
          <Info label="Company type" value={company.company_type} />
          <Info label="Contact person" value={company.contact_person} />
          <Info label="Email" value={company.email} />
          <Info label="Phone" value={company.phone} />
          <Info label="State" value={company.state} />
          <Info label="Registration date" value={formatDate(company.registration_date)} />
          <Info label="Expiry date" value={formatDate(company.expiry_date)} />
          <Info label="Rating" value={company.rating?.toString()} />
          <Info label="PIC" value={company.pic?.full_name} />
          {company.contractor ? (
            <>
              <Info label="CIDB grade" value={company.contractor.cidb_grade} />
              <Info label="CIDB number" value={company.contractor.cidb_registration_number} />
              <Info label="CIDB expiry" value={formatDate(company.contractor.cidb_expiry_date)} />
            </>
          ) : null}
          <div className="md:col-span-2 rounded-lg border p-4 text-sm">{company.remarks || "No remarks"}</div>
          {canManageCompanies(profile.role) ? (
            <form action={assignStaffAction} className="md:col-span-2 flex gap-2">
              <input type="hidden" name="company_id" value={company.id} />
              <select name="user_id" className="h-8 rounded-md border bg-background px-3 text-sm">
                {staff.filter((s) => s.role === "staff").map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name || s.email}</option>
                ))}
              </select>
              <Button type="submit" variant="outline">Assign staff</Button>
            </form>
          ) : null}
        </TabsContent>
        <TabsContent value="contacts">
          {writable ? (
            <form action={saveContactAction} className="mb-4 grid gap-2 rounded-lg border p-4 md:grid-cols-3">
              <input type="hidden" name="company_id" value={company.id} />
              <Input name="full_name" placeholder="Name" required />
              <Input name="position" placeholder="Position" />
              <Input name="department" placeholder="Department" />
              <Input name="phone" placeholder="Phone" />
              <Input name="email" placeholder="Email" />
              <Input name="whatsapp" placeholder="WhatsApp" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_primary" /> Primary contact</label>
              <Button type="submit">Add contact</Button>
            </form>
          ) : null}
          <Table rows={contacts.map((c) => [c.full_name, c.position, c.phone, c.email, c.whatsapp, c.is_primary ? "Primary" : ""])} headers={["Name", "Position", "Phone", "Email", "WhatsApp", "Flag"]} />
        </TabsContent>
        <TabsContent value="projects">
          <Table
            headers={["ID", "Name", "Status", "Value", "End"]}
            rows={projects.map((p) => [p.project_code, p.project_name, p.status, formatMoney(p.project_value, p.currency), formatDate(p.end_date)])}
          />
        </TabsContent>
        <TabsContent value="activities">
          {writable ? (
            <form action={saveActivityAction} className="mb-4 grid gap-2 rounded-lg border p-4 md:grid-cols-2">
              <input type="hidden" name="company_id" value={company.id} />
              <select name="activity_type" className="h-8 rounded-md border bg-background px-3 text-sm">
                {ACTIVITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <Input name="subject" placeholder="Subject" required />
              <Input name="activity_date" type="datetime-local" />
              <Input name="follow_up_date" type="date" />
              <Textarea name="description" className="md:col-span-2" placeholder="Description" />
              <Button type="submit">Log activity</Button>
            </form>
          ) : null}
          <div className="space-y-3">
            {activities.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="font-medium">{item.subject}</div>
                <div className="text-xs text-muted-foreground">{item.activity_type} · {formatDateTime(item.activity_date)} · {item.user?.full_name}</div>
                <p className="mt-2 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="payments">
          <Table
            headers={["ID", "Type", "Amount", "Status", "Date"]}
            rows={payments.map((p) => [p.payment_code, p.payment_type, formatMoney(p.amount, p.currency), p.status, formatDate(p.paid_at || p.created_at)])}
          />
        </TabsContent>
        <TabsContent value="notes">
          {writable && !isReadOnly(profile.role) ? (
            <form action={saveNoteAction} className="mb-4 space-y-2 rounded-lg border p-4">
              <input type="hidden" name="company_id" value={company.id} />
              <Label>Internal note</Label>
              <Textarea name="body" required />
              <Button type="submit">Add note</Button>
            </form>
          ) : null}
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border p-4 text-sm">
                <div className="text-xs text-muted-foreground">{note.author?.full_name} · {formatDateTime(note.created_at)}</div>
                <p className="mt-2">{note.body}</p>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="audit">
          <Table
            headers={["When", "Action", "Module"]}
            rows={audit.map((item) => [formatDateTime(item.created_at), item.action, item.module])}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value || "—"}</div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number | null | undefined)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>{headers.map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              {row.map((cell, j) => <td key={j} className="px-3 py-2">{cell ?? "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
