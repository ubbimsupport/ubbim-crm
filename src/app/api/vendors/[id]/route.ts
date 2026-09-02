import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { companyRecord, parseCompanyWrite } from "@/lib/company-payload";
import { getCompany } from "@/lib/queries";
import { canManageCompanies, canViewVendors, canWriteRecords } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

function invalidId() {
  return NextResponse.json({ error: "Choose a valid vendor." }, { status: 400 });
}

async function requireApiProfile() {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) {
    return { profile: null, unauthorized: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }
  return { profile, unauthorized: null };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { profile, unauthorized } = await requireApiProfile();
  if (!profile) return unauthorized;
  if (!canViewVendors(profile.role)) {
    return NextResponse.json({ error: "You cannot view vendors." }, { status: 403 });
  }
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return invalidId();
  const company = await getCompany(id);
  if (!company) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
  return NextResponse.json({ data: company });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { profile, unauthorized } = await requireApiProfile();
  if (!profile) return unauthorized;
  if (!canWriteRecords(profile.role)) {
    return NextResponse.json({ error: "Read-only users cannot update vendors." }, { status: 403 });
  }
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return invalidId();
  const existing = await getCompany(id);
  if (!existing) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
  const body = await request.json().catch(() => null);
  const parsed = parseCompanyWrite({
    company_name: existing.company_name,
    company_kind: existing.company_kind,
    status: existing.status,
    ...(body ?? {}),
  });
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error ?? "Check the vendor details." }, { status: 400 });
  }
  const payload = companyRecord(parsed.data);
  const supabase = await createClient();
  const updated = await supabase.from("crm_companies").update(payload).eq("id", id);
  if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 400 });
  if (payload.company_kind === "vendor") {
    await supabase.from("crm_vendors").update({
      specialization: parsed.data.specialization ?? null,
    }).eq("company_id", id);
  }
  return NextResponse.json({ data: { id } });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { profile, unauthorized } = await requireApiProfile();
  if (!profile) return unauthorized;
  if (!canManageCompanies(profile.role)) {
    return NextResponse.json({ error: "Only administrators can delete vendors." }, { status: 403 });
  }
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return invalidId();
  const supabase = await createClient();
  const removed = await supabase.from("crm_companies").delete().eq("id", id);
  if (removed.error) return NextResponse.json({ error: removed.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
