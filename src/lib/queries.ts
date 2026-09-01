import { createClient } from "@/lib/supabase/server";
import type { Company, CompanyKind, FunnelEvent } from "@/lib/types";

export async function listCompanies(kind: CompanyKind | "all", query: { q?: string; status?: string; state?: string; sort?: string; funnel?: string }) {
  const supabase = await createClient();
  let request = supabase
    .from("crm_companies")
    .select("*, category:crm_categories(*), pic:crm_profiles!pic_id(id, full_name, email), vendor:crm_vendors(*), contractor:crm_contractors(*)")
    .order(query.sort === "name" ? "company_name" : "created_at", { ascending: query.sort === "name" });
  if (kind !== "all") request = request.eq("company_kind", kind);

  if (query.status) request = request.eq("status", query.status);
  if (query.state) request = request.eq("state", query.state);
  if (query.funnel) request = request.eq("funnel_stage", query.funnel);
  if (query.q) {
    request = request.or(`company_name.ilike.%${query.q}%,company_code.ilike.%${query.q}%,registration_number.ilike.%${query.q}%,email.ilike.%${query.q}%`);
  }
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []) as Company[];
}

export async function getCompany(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_companies")
    .select("*, category:crm_categories(*), pic:crm_profiles!pic_id(id, full_name, email), vendor:crm_vendors(*), contractor:crm_contractors(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const company = data as Company & { vendor?: Company["vendor"] | Company["vendor"][]; contractor?: Company["contractor"] | Company["contractor"][] };
  return {
    ...company,
    vendor: Array.isArray(company.vendor) ? company.vendor[0] : company.vendor,
    contractor: Array.isArray(company.contractor) ? company.contractor[0] : company.contractor,
  } as Company;
}

export async function getCompanyRelations(id: string) {
  const supabase = await createClient();
  const [contacts, documents, projects, activities, payments, notes, audit, types, staff, funnel] = await Promise.all([
    supabase.from("crm_contacts").select("*").eq("company_id", id).order("is_primary", { ascending: false }),
    supabase.from("crm_documents").select("*, document_type:crm_document_types(*)").eq("company_id", id).order("created_at", { ascending: false }),
    supabase.from("crm_projects").select("*").or(`vendor_id.eq.${id},contractor_id.eq.${id}`).order("created_at", { ascending: false }),
    supabase.from("crm_activities").select("*, user:crm_profiles(id, full_name)").eq("company_id", id).order("activity_date", { ascending: false }),
    supabase.from("crm_payments").select("*").eq("company_id", id).order("created_at", { ascending: false }),
    supabase.from("crm_notes").select("*, author:crm_profiles(id, full_name)").eq("company_id", id).order("created_at", { ascending: false }),
    supabase.from("crm_audit_logs").select("*").eq("record_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("crm_document_types").select("*").eq("is_active", true),
    supabase.from("crm_profiles").select("*").eq("is_active", true).order("full_name"),
    supabase.from("crm_funnel_events").select("*, creator:crm_profiles(id, full_name)").eq("company_id", id).order("created_at", { ascending: false }),
  ]);
  return {
    contacts: contacts.data ?? [],
    documents: documents.data ?? [],
    projects: projects.data ?? [],
    activities: activities.data ?? [],
    payments: payments.data ?? [],
    notes: notes.data ?? [],
    audit: audit.data ?? [],
    documentTypes: types.data ?? [],
    staff: staff.data ?? [],
    funnelEvents: (funnel.data ?? []) as FunnelEvent[],
  };
}

export async function getCompanyByEmail(email: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_companies")
    .select("*, category:crm_categories(*), pic:crm_profiles!pic_id(id, full_name, email), vendor:crm_vendors(*), contractor:crm_contractors(*)")
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const company = data as Company & { vendor?: Company["vendor"] | Company["vendor"][]; contractor?: Company["contractor"] | Company["contractor"][] };
  return {
    ...company,
    vendor: Array.isArray(company.vendor) ? company.vendor[0] : company.vendor,
    contractor: Array.isArray(company.contractor) ? company.contractor[0] : company.contractor,
  } as Company;
}

export async function getFunnelEvents(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_funnel_events")
    .select("*, creator:crm_profiles(id, full_name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FunnelEvent[];
}
