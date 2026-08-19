"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { emailCopy, sendEmail } from "@/lib/email/send";
import { getAppUrl } from "@/lib/env";
import { assertRole, canManageCompanies, canWriteRecords } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { hasAdminClient, createAdminClient } from "@/lib/supabase/admin";
import type { CompanyKind, CompanyStatus, UserRole } from "@/lib/types";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formOptional(formData: FormData, key: string) {
  const value = formString(formData, key);
  return value.length ? value : null;
}

export async function signInAction(formData: FormData) {
  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const next = formString(formData, "next") || "/dashboard";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (userId) {
    await supabase.from("crm_profiles").update({ last_login_at: new Date().toISOString() }).eq("id", userId);
  }
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = formString(formData, "email");
  const supabase = await createClient();
  const redirectTo = `${getAppUrl()}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  await sendEmail({
    to: email,
    subject: emailCopy.passwordReset(redirectTo).subject,
    heading: emailCopy.passwordReset(redirectTo).heading,
    bodyHtml: emailCopy.passwordReset(redirectTo).bodyHtml,
    ctaLabel: "Open CRM",
    ctaUrl: redirectTo,
  });
  redirect("/forgot-password?sent=1");
}

export async function updatePasswordAction(formData: FormData) {
  const password = formString(formData, "password");
  if (password.length < 8) redirect("/reset-password?error=Password+must+be+at+least+8+characters");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  redirect("/login?reset=1");
}

export async function submitPublicRegistrationAction(formData: FormData) {
  const kind = formString(formData, "kind") as CompanyKind;
  const schema = z.object({
    company_name: z.string().min(2),
    email: z.string().email(),
  });
  const parsed = schema.safeParse({
    company_name: formString(formData, "company_name"),
    email: formString(formData, "email"),
  });
  if (!parsed.success) redirect("/register?error=Please+complete+the+required+fields");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("crm_submit_company_registration", {
    p_kind: kind,
    p_company_name: parsed.data.company_name,
    p_registration_number: formOptional(formData, "registration_number"),
    p_company_type: formOptional(formData, "company_type"),
    p_category_id: formOptional(formData, "category_id"),
    p_contact_person: formOptional(formData, "contact_person"),
    p_email: parsed.data.email,
    p_phone: formOptional(formData, "phone"),
    p_address: formOptional(formData, "address"),
    p_state: formOptional(formData, "state"),
    p_cidb_grade: formOptional(formData, "cidb_grade"),
    p_cidb_registration_number: formOptional(formData, "cidb_registration_number"),
    p_cidb_expiry_date: formOptional(formData, "cidb_expiry_date"),
    p_specialization: formOptional(formData, "specialization"),
  });
  if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);

  const copy = emailCopy.registration(parsed.data.company_name, kind);
  await sendEmail({ to: parsed.data.email, ...copy });
  redirect(`/register?success=1&id=${data ?? ""}`);
}

export async function upsertCompanyAction(formData: FormData) {
  const profile = await requireProfile();
  const kind = formString(formData, "kind") as CompanyKind;
  const id = formOptional(formData, "id");
  const supabase = await createClient();

  if (!id && !canManageCompanies(profile.role)) {
    throw new Error("Only administrators can register companies.");
  }
  if (id && !canWriteRecords(profile.role)) {
    throw new Error("Read-only users cannot update records.");
  }

  const payload = {
    company_name: formString(formData, "company_name"),
    registration_number: formOptional(formData, "registration_number"),
    company_kind: kind,
    company_type: formOptional(formData, "company_type"),
    category_id: formOptional(formData, "category_id"),
    contact_person: formOptional(formData, "contact_person"),
    email: formOptional(formData, "email"),
    phone: formOptional(formData, "phone"),
    address: formOptional(formData, "address"),
    city: formOptional(formData, "city"),
    state: formOptional(formData, "state"),
    postcode: formOptional(formData, "postcode"),
    pic_id: formOptional(formData, "pic_id"),
    status: (formOptional(formData, "status") as CompanyStatus | null) ?? "pending",
    registration_date: formOptional(formData, "registration_date"),
    expiry_date: formOptional(formData, "expiry_date"),
    rating: formOptional(formData, "rating") ? Number(formOptional(formData, "rating")) : null,
    remarks: formOptional(formData, "remarks"),
  };

  let companyId = id;
  if (id) {
    const { error } = await supabase.from("crm_companies").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("crm_companies")
      .insert({ ...payload, created_by: profile.id })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    companyId = data.id;
    if (kind === "vendor") {
      const { error: vendorError } = await supabase.from("crm_vendors").insert({
        company_id: companyId,
        specialization: formOptional(formData, "specialization"),
      });
      if (vendorError) throw new Error(vendorError.message);
    } else {
      const { error: contractorError } = await supabase.from("crm_contractors").insert({
        company_id: companyId,
        cidb_grade: formOptional(formData, "cidb_grade"),
        cidb_registration_number: formOptional(formData, "cidb_registration_number"),
        cidb_expiry_date: formOptional(formData, "cidb_expiry_date"),
        specialization: formOptional(formData, "specialization"),
      });
      if (contractorError) throw new Error(contractorError.message);
    }
  }

  if (kind === "vendor") {
    await supabase.from("crm_vendors").update({
      specialization: formOptional(formData, "specialization"),
    }).eq("company_id", companyId);
  } else {
    await supabase.from("crm_contractors").update({
      cidb_grade: formOptional(formData, "cidb_grade"),
      cidb_registration_number: formOptional(formData, "cidb_registration_number"),
      cidb_expiry_date: formOptional(formData, "cidb_expiry_date"),
      specialization: formOptional(formData, "specialization"),
    }).eq("company_id", companyId);
  }

  const path = kind === "vendor" ? "/vendors" : "/contractors";
  revalidatePath(path);
  redirect(`${path}/${companyId}`);
}

export async function updateCompanyStatusAction(formData: FormData) {
  const profile = await requireProfile();
  assertRole(profile, ["super_admin", "admin"]);
  const id = formString(formData, "id");
  const status = formString(formData, "status") as CompanyStatus;
  const kind = formString(formData, "kind") as CompanyKind;
  const supabase = await createClient();
  const { data: company, error } = await supabase
    .from("crm_companies")
    .update({ status })
    .eq("id", id)
    .select("company_name, email")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("crm_notifications").insert({
    user_id: profile.id,
    type: status === "rejected" ? "registration_rejection" : "registration_approval",
    title: `${company.company_name} ${status}`,
    body: `Company status changed to ${status}.`,
    link: `/${kind}s/${id}`,
    entity_type: "company",
    entity_id: id,
  });

  if (company.email) {
    const copy = status === "rejected"
      ? emailCopy.rejection(company.company_name, formOptional(formData, "reason") ?? undefined)
      : emailCopy.approval(company.company_name);
    await sendEmail({ to: company.email, ...copy });
  }

  revalidatePath(`/${kind}s/${id}`);
}

export async function saveContactAction(formData: FormData) {
  const profile = await requireProfile();
  if (!canWriteRecords(profile.role)) throw new Error("Read-only access");
  const supabase = await createClient();
  const companyId = formString(formData, "company_id");
  const id = formOptional(formData, "id");
  const payload = {
    company_id: companyId,
    full_name: formString(formData, "full_name"),
    position: formOptional(formData, "position"),
    department: formOptional(formData, "department"),
    phone: formOptional(formData, "phone"),
    email: formOptional(formData, "email"),
    whatsapp: formOptional(formData, "whatsapp"),
    is_primary: formString(formData, "is_primary") === "on",
    remarks: formOptional(formData, "remarks"),
    created_by: profile.id,
  };
  if (payload.is_primary) {
    await supabase.from("crm_contacts").update({ is_primary: false }).eq("company_id", companyId);
  }
  const { error } = id
    ? await supabase.from("crm_contacts").update(payload).eq("id", id)
    : await supabase.from("crm_contacts").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(`/vendors/${companyId}`);
  revalidatePath(`/contractors/${companyId}`);
  revalidatePath("/contacts");
}

export async function deleteContactAction(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = formString(formData, "id");
  const companyId = formString(formData, "company_id");
  const { error } = await supabase.from("crm_contacts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/vendors/${companyId}`);
  revalidatePath(`/contractors/${companyId}`);
  revalidatePath("/contacts");
}

export async function saveActivityAction(formData: FormData) {
  const profile = await requireProfile();
  if (!canWriteRecords(profile.role)) throw new Error("Read-only access");
  const supabase = await createClient();
  const payload = {
    company_id: formOptional(formData, "company_id"),
    project_id: formOptional(formData, "project_id"),
    user_id: profile.id,
    activity_type: formString(formData, "activity_type"),
    subject: formString(formData, "subject"),
    description: formOptional(formData, "description"),
    activity_date: formOptional(formData, "activity_date") ?? new Date().toISOString(),
    follow_up_date: formOptional(formData, "follow_up_date"),
    status: formString(formData, "status") || "open",
  };
  const { error } = await supabase.from("crm_activities").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/activities");
  if (payload.company_id) {
    revalidatePath(`/vendors/${payload.company_id}`);
    revalidatePath(`/contractors/${payload.company_id}`);
  }
}

export async function saveNoteAction(formData: FormData) {
  const profile = await requireProfile();
  if (!canWriteRecords(profile.role)) throw new Error("Read-only access");
  const supabase = await createClient();
  const companyId = formString(formData, "company_id");
  const { error } = await supabase.from("crm_notes").insert({
    company_id: companyId,
    author_id: profile.id,
    body: formString(formData, "body"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/vendors/${companyId}`);
  revalidatePath(`/contractors/${companyId}`);
}

export async function saveProjectAction(formData: FormData) {
  const profile = await requireProfile();
  assertRole(profile, ["super_admin", "admin"]);
  const supabase = await createClient();
  const id = formOptional(formData, "id");
  const payload = {
    project_name: formString(formData, "project_name"),
    project_number: formOptional(formData, "project_number"),
    client_name: formOptional(formData, "client_name"),
    vendor_id: formOptional(formData, "vendor_id"),
    contractor_id: formOptional(formData, "contractor_id"),
    project_manager_id: formOptional(formData, "project_manager_id"),
    start_date: formOptional(formData, "start_date"),
    end_date: formOptional(formData, "end_date"),
    project_value: Number(formString(formData, "project_value") || 0),
    location: formOptional(formData, "location"),
    status: formString(formData, "status") || "planning",
    progress: Number(formString(formData, "progress") || 0),
    description: formOptional(formData, "description"),
    remarks: formOptional(formData, "remarks"),
  };
  if (id) {
    const { error } = await supabase.from("crm_projects").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath(`/projects/${id}`);
    redirect(`/projects/${id}`);
  }
  const { data, error } = await supabase
    .from("crm_projects")
    .insert({ ...payload, created_by: profile.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await supabase.from("crm_notifications").insert({
    user_id: profile.id,
    type: "new_project",
    title: `New project: ${payload.project_name}`,
    body: "A new project was created.",
    link: `/projects/${data.id}`,
    entity_type: "project",
    entity_id: data.id,
  });
  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function saveDocumentMetaAction(formData: FormData) {
  const profile = await requireProfile();
  if (!canWriteRecords(profile.role)) throw new Error("Read-only access");
  const supabase = await createClient();
  const companyId = formString(formData, "company_id");
  const payload = {
    company_id: companyId,
    document_type_id: formOptional(formData, "document_type_id"),
    document_name: formString(formData, "document_name"),
    document_number: formOptional(formData, "document_number"),
    issue_date: formOptional(formData, "issue_date"),
    expiry_date: formOptional(formData, "expiry_date"),
    remarks: formOptional(formData, "remarks"),
    uploaded_by: profile.id,
  };
  const { data, error } = await supabase.from("crm_documents").insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  revalidatePath("/documents");
  return data.id as string;
}

export async function markNotificationsReadAction() {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("crm_notifications").update({ is_read: true }).eq("user_id", profile.id).eq("is_read", false);
  revalidatePath("/notifications");
}

export async function createUserAction(formData: FormData) {
  const profile = await requireProfile();
  assertRole(profile, ["super_admin"]);
  if (!hasAdminClient()) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to create users.");
  const admin = createAdminClient();
  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const fullName = formString(formData, "full_name");
  const role = formString(formData, "role") as UserRole;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) throw new Error(error?.message || "Unable to create user");
  await admin.from("crm_profiles").update({
    full_name: fullName,
    role,
    is_active: true,
    job_title: formOptional(formData, "job_title"),
    phone: formOptional(formData, "phone"),
  }).eq("id", data.user.id);
  const welcome = emailCopy.welcome(fullName || email);
  await sendEmail({ to: email, ...welcome, ctaLabel: "Sign in", ctaUrl: `${getAppUrl()}/login` });
  revalidatePath("/users");
}

export async function updateUserRoleAction(formData: FormData) {
  const profile = await requireProfile();
  assertRole(profile, ["super_admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("crm_profiles").update({
    role: formString(formData, "role") as UserRole,
    is_active: formString(formData, "is_active") === "true",
    full_name: formString(formData, "full_name"),
  }).eq("id", formString(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/users");
}

export async function saveSettingsAction(formData: FormData) {
  const profile = await requireProfile();
  assertRole(profile, ["super_admin"]);
  const supabase = await createClient();
  const entries = [
    ["organization_name", formString(formData, "organization_name")],
    ["support_email", formString(formData, "support_email")],
    ["currency", formString(formData, "currency") || "MYR"],
    ["vendor_registration_fee", Number(formString(formData, "vendor_registration_fee") || 0)],
    ["contractor_registration_fee", Number(formString(formData, "contractor_registration_fee") || 0)],
  ] as const;
  for (const [key, value] of entries) {
    await supabase.from("crm_settings").upsert({ key, value, updated_by: profile.id });
  }
  revalidatePath("/settings");
}

export async function assignStaffAction(formData: FormData) {
  const profile = await requireProfile();
  assertRole(profile, ["super_admin", "admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("crm_company_assignments").insert({
    company_id: formString(formData, "company_id"),
    user_id: formString(formData, "user_id"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/vendors/${formString(formData, "company_id")}`);
  revalidatePath(`/contractors/${formString(formData, "company_id")}`);
}
