import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  Activity,
  Company,
  Contact,
  Contractor,
  ContractorNotificationSettings,
  CrmDocument,
  Notification,
  Payment,
  Profile,
  Project,
} from "@/lib/types";

export type ContractorContext = {
  profile: Profile;
  company: Company | null;
  contractor: Contractor | null;
  contact: Contact | null;
  approved: boolean;
};

export function cidbStatus(expiry?: string | null) {
  if (!expiry) return "not_registered";
  const date = new Date(expiry);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const warn = new Date(today);
  warn.setDate(warn.getDate() + 90);
  if (date < today) return "expired";
  if (date <= warn) return "expiring_soon";
  return "active";
}

export function profileCompletion(input: {
  company: Company | null;
  contractor: Contractor | null;
  contact: Contact | null;
}) {
  const { company, contractor, contact } = input;
  const fields = [
    company?.company_name,
    company?.registration_number,
    company?.company_type,
    company?.address,
    company?.city,
    company?.state,
    company?.postcode,
    company?.country,
    company?.email,
    company?.phone,
    company?.website,
    contractor?.cidb_grade,
    contractor?.cidb_registration_number,
    contractor?.cidb_expiry_date,
    contact?.full_name || company?.contact_person,
    contact?.phone || company?.phone,
  ];
  const filled = fields.filter((value) => Boolean(value && String(value).trim())).length;
  return Math.round((filled / fields.length) * 100);
}

export async function getContractorContext(): Promise<ContractorContext> {
  const profile = await requireRole(["contractor"]);
  const supabase = await createClient();
  let companyId = profile.company_id;

  if (!companyId) {
    const { data: match } = await supabase
      .from("crm_companies")
      .select("id")
      .eq("company_kind", "contractor")
      .ilike("email", profile.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    companyId = match?.id ?? null;
    if (companyId) {
      await supabase.from("crm_profiles").update({ company_id: companyId }).eq("id", profile.id);
      profile.company_id = companyId;
    }
  }

  if (!companyId) {
    return { profile, company: null, contractor: null, contact: null, approved: false };
  }

  const [{ data: company }, { data: contact }] = await Promise.all([
    supabase
      .from("crm_companies")
      .select("*, contractor:crm_contractors(*)")
      .eq("id", companyId)
      .maybeSingle(),
    supabase
      .from("crm_contacts")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_primary", true)
      .maybeSingle(),
  ]);

  const record = company as (Company & { contractor?: Contractor | Contractor[] | null }) | null;
  const contractor = Array.isArray(record?.contractor) ? record.contractor[0] : record?.contractor ?? null;
  const resolved = record ? { ...record, contractor } : null;

  return {
    profile,
    company: resolved,
    contractor,
    contact: (contact as Contact | null) ?? null,
    approved: resolved?.status === "active",
  };
}

export async function getContractorDashboardData(companyId: string) {
  const supabase = await createClient();
  const [documents, projects, payments, activities, notifications] = await Promise.all([
    supabase
      .from("crm_documents")
      .select("*, document_type:crm_document_types(*)")
      .eq("company_id", companyId)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("crm_projects")
      .select("*, project_manager:crm_profiles!project_manager_id(id, full_name)")
      .or(`contractor_id.eq.${companyId}`)
      .order("created_at", { ascending: false }),
    supabase.from("crm_payments").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase
      .from("crm_activities")
      .select("*")
      .eq("company_id", companyId)
      .order("activity_date", { ascending: false })
      .limit(12),
    supabase
      .from("crm_notifications")
      .select("*")
      .eq("user_id", (await supabase.auth.getClaims()).data?.claims?.sub as string)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return {
    documents: (documents.data ?? []) as CrmDocument[],
    projects: (projects.data ?? []) as Project[],
    payments: (payments.data ?? []) as Payment[],
    activities: (activities.data ?? []) as Activity[],
    notifications: (notifications.data ?? []) as Notification[],
  };
}

export async function getNotificationSettings(userId: string): Promise<ContractorNotificationSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_contractor_notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return data as ContractorNotificationSettings;
  const defaults: ContractorNotificationSettings = {
    user_id: userId,
    email_notifications: true,
    document_expiry_alerts: true,
    payment_notifications: true,
    project_notifications: true,
    support_notifications: true,
    updated_at: new Date().toISOString(),
  };
  await supabase.from("crm_contractor_notification_settings").upsert(defaults);
  return defaults;
}
