import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { companyRecord, parseCompanyWrite } from "@/lib/company-payload";
import { listCompanies } from "@/lib/queries";
import { canManageCompanies, canViewVendors } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

async function requireApiProfile() {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) {
    return { profile: null, unauthorized: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }
  return { profile, unauthorized: null };
}

export async function GET(request: Request) {
  const { profile, unauthorized } = await requireApiProfile();
  if (!profile) return unauthorized;
  if (!canViewVendors(profile.role)) {
    return NextResponse.json({ error: "You cannot view vendors." }, { status: 403 });
  }
  const url = new URL(request.url);
  const companies = await listCompanies("all", {
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
  });
  return NextResponse.json({ data: companies });
}

export async function POST(request: Request) {
  const { profile, unauthorized } = await requireApiProfile();
  if (!profile) return unauthorized;
  if (!canManageCompanies(profile.role)) {
    return NextResponse.json({ error: "Only administrators can create vendors." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = parseCompanyWrite({ company_kind: "vendor", ...(body ?? {}) });
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error ?? "Check the vendor details." }, { status: 400 });
  }
  const payload = companyRecord({ ...parsed.data, company_kind: "vendor" });
  const supabase = await createClient();
  const inserted = await supabase
    .from("crm_companies")
    .insert({ ...payload, created_by: profile.id })
    .select("id")
    .single();
  if (inserted.error || !inserted.data) {
    return NextResponse.json({ error: inserted.error?.message ?? "Unable to create vendor." }, { status: 400 });
  }
  const { error: vendorError } = await supabase.from("crm_vendors").insert({
    company_id: inserted.data.id,
    specialization: parsed.data.specialization ?? null,
  });
  if (vendorError) return NextResponse.json({ error: vendorError.message }, { status: 400 });
  return NextResponse.json({ data: { id: inserted.data.id } }, { status: 201 });
}
