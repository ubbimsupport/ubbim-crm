"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile, requireRole } from "@/lib/auth";
import { ALLOWED_DOCUMENT_MIME_TYPES, MAX_DOCUMENT_BYTES } from "@/lib/constants";
import { getContractorContext } from "@/lib/contractor";
import { emailCopy, sendEmail } from "@/lib/email/send";
import { getAppUrl } from "@/lib/env";
import { isStaffRole } from "@/lib/rbac";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  ActivityType,
  NotificationType,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/lib/types";

export type ContractorFormState = { error?: string; ok?: boolean; message?: string };

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formOptional(formData: FormData, key: string) {
  const value = formString(formData, key);
  return value.length ? value : null;
}

function revalidateContractor(paths: string[] = []) {
  for (const path of ["/contractor/dashboard", "/contractor/company", ...paths]) {
    revalidatePath(path);
  }
}

async function logActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    companyId: string;
    userId: string;
    type: ActivityType;
    subject: string;
    description?: string | null;
  },
) {
  await supabase.from("crm_activities").insert({
    company_id: input.companyId,
    user_id: input.userId,
    activity_type: input.type,
    subject: input.subject,
    description: input.description ?? null,
    activity_date: new Date().toISOString(),
    status: "completed",
  });
}

async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link: string,
  entityType?: string,
  entityId?: string,
) {
  const payload = {
    user_id: userId,
    type,
    title,
    body,
    link,
    entity_type: entityType,
    entity_id: entityId,
  };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (claims?.claims?.sub === userId) {
    await supabase.from("crm_notifications").insert(payload);
    return;
  }
  if (!hasAdminClient()) return;
  await createAdminClient().from("crm_notifications").insert(payload);
}

async function notifyAdmins(type: NotificationType, title: string, body: string, link: string, entityId?: string) {
  if (!hasAdminClient()) return;
  const admin = createAdminClient();
  const { data } = await admin
    .from("crm_profiles")
    .select("id")
    .in("role", ["super_admin", "admin"])
    .eq("is_active", true);
  if (!data?.length) return;
  await admin.from("crm_notifications").insert(
    data.map((user) => ({
      user_id: user.id,
      type,
      title,
      body,
      link,
      entity_type: "company",
      entity_id: entityId,
    })),
  );
}

function validateUpload(file: File) {
  if (file.size > MAX_DOCUMENT_BYTES) return "File must be 10MB or smaller.";
  if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Upload a PDF, Word, JPEG, PNG, or WebP file.";
  }
  return null;
}

function storagePath(companyId: string, fileName: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return `${companyId}/${crypto.randomUUID()}-${safe}`;
}

export async function updateContractorCompanyAction(
  _prev: ContractorFormState,
  formData: FormData,
): Promise<ContractorFormState> {
  const { profile, company } = await getContractorContext();
  if (!company) return { error: "No company profile is linked to this account." };

  const name = formString(formData, "company_name");
  if (name.length < 2) return { error: "Enter the company name." };
  const email = formOptional(formData, "email");
  if (email && !z.email().safeParse(email).success) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_companies")
    .update({
      company_name: name,
      registration_number: formOptional(formData, "registration_number"),
      company_type: formOptional(formData, "company_type"),
      address: formOptional(formData, "address"),
      address_line2: formOptional(formData, "address_line2"),
      city: formOptional(formData, "city"),
      state: formOptional(formData, "state"),
      postcode: formOptional(formData, "postcode"),
      country: formOptional(formData, "country") || "Malaysia",
      email,
      phone: formOptional(formData, "phone"),
      website: formOptional(formData, "website"),
      contact_person: formOptional(formData, "contact_person"),
    })
    .eq("id", company.id);
  if (error) return { error: error.message };

  await supabase
    .from("crm_contractors")
    .update({
      cidb_grade: formOptional(formData, "cidb_grade"),
      cidb_category: formOptional(formData, "cidb_category"),
      cidb_registration_number: formOptional(formData, "cidb_registration_number"),
      cidb_issue_date: formOptional(formData, "cidb_issue_date"),
      cidb_expiry_date: formOptional(formData, "cidb_expiry_date"),
      specialization: formOptional(formData, "specialization"),
    })
    .eq("company_id", company.id);

  const contactName = formOptional(formData, "contact_name") || formOptional(formData, "contact_person");
  if (contactName) {
    const contactPayload = {
      company_id: company.id,
      full_name: contactName,
      position: formOptional(formData, "contact_position"),
      email: formOptional(formData, "contact_email"),
      phone: formOptional(formData, "contact_phone"),
      whatsapp: formOptional(formData, "contact_whatsapp"),
      is_primary: true,
    };
    const contactId = formOptional(formData, "contact_id");
    await supabase.from("crm_contacts").update({ is_primary: false }).eq("company_id", company.id);
    if (contactId) {
      await supabase.from("crm_contacts").update(contactPayload).eq("id", contactId);
    } else {
      await supabase.from("crm_contacts").insert({ ...contactPayload, created_by: profile.id });
    }
  }

  await logActivity(supabase, {
    companyId: company.id,
    userId: profile.id,
    type: "profile_update",
    subject: "Profile updated",
    description: "Company profile details were updated from the contractor portal.",
  });
  await notifyUser(profile.id, "profile_update", "Profile updated", "Your company profile was saved.", "/contractor/company");
  revalidateContractor();
  return { ok: true, message: "Company profile saved." };
}

export async function uploadContractorDocumentAction(
  _prev: ContractorFormState,
  formData: FormData,
): Promise<ContractorFormState> {
  const { profile, company } = await getContractorContext();
  if (!company) return { error: "No company profile is linked to this account." };

  const documentName = formString(formData, "document_name");
  if (documentName.length < 2) return { error: "Enter a document name." };
  const replaceId = formOptional(formData, "document_id");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  const invalid = validateUpload(file);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const path = storagePath(company.id, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from("crm-documents").upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) return { error: uploadError.message };

  const payload = {
    company_id: company.id,
    document_type_id: formOptional(formData, "document_type_id"),
    document_name: documentName,
    document_number: formOptional(formData, "document_number"),
    issue_date: formOptional(formData, "issue_date"),
    expiry_date: formOptional(formData, "expiry_date"),
    file_path: path,
    file_name: file.name,
    mime_type: file.type,
    file_size: file.size,
    uploaded_by: profile.id,
    uploaded_at: new Date().toISOString(),
    review_status: "pending_review" as const,
  };

  if (replaceId) {
    const { data: existing } = await supabase
      .from("crm_documents")
      .select("id, file_path")
      .eq("id", replaceId)
      .eq("company_id", company.id)
      .maybeSingle();
    if (!existing) return { error: "Document not found." };
    if (existing.file_path) await supabase.storage.from("crm-documents").remove([existing.file_path]);
    const { error } = await supabase.from("crm_documents").update(payload).eq("id", replaceId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("crm_documents").insert(payload);
    if (error) return { error: error.message };
  }

  await logActivity(supabase, {
    companyId: company.id,
    userId: profile.id,
    type: "document_uploaded",
    subject: replaceId ? "Document replaced" : "Document uploaded",
    description: documentName,
  });
  await notifyUser(
    profile.id,
    "document_uploaded",
    replaceId ? "Document replaced" : "Document uploaded",
    `${documentName} was submitted for review.`,
    "/contractor/documents",
  );
  await notifyAdmins(
    "document_uploaded",
    `Document uploaded: ${company.company_name}`,
    `${documentName} is waiting for review.`,
    `/vendors/${company.id}`,
    company.id,
  );
  if (company.email) {
    const copy = emailCopy.documentUploaded(company.company_name, documentName);
    await sendEmail({ to: company.email, ...copy });
  }
  revalidateContractor(["/contractor/documents"]);
  return { ok: true, message: replaceId ? "Document replaced and sent for review." : "Document uploaded for review." };
}

export async function getContractorDocumentUrlAction(documentId: string) {
  const { company } = await getContractorContext();
  if (!company) return { error: "No company profile is linked to this account." };
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_documents")
    .select("file_path, company_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!data?.file_path || data.company_id !== company.id) return { error: "Document not found." };
  const { data: signed, error } = await supabase.storage.from("crm-documents").createSignedUrl(data.file_path, 60);
  if (error || !signed?.signedUrl) return { error: error?.message || "Unable to create a download link." };
  return { url: signed.signedUrl };
}

export async function markContractorNotificationReadAction(formData: FormData) {
  const profile = await requireRole(["contractor"]);
  const id = formString(formData, "id");
  const supabase = await createClient();
  await supabase.from("crm_notifications").update({ is_read: true }).eq("id", id).eq("user_id", profile.id);
  revalidatePath("/contractor/notifications");
  revalidatePath("/contractor/dashboard");
}

export async function markAllContractorNotificationsReadAction() {
  const profile = await requireRole(["contractor"]);
  const supabase = await createClient();
  await supabase.from("crm_notifications").update({ is_read: true }).eq("user_id", profile.id).eq("is_read", false);
  revalidatePath("/contractor/notifications");
  revalidatePath("/contractor/dashboard");
}

export async function deleteContractorNotificationAction(formData: FormData) {
  const profile = await requireRole(["contractor"]);
  const id = formString(formData, "id");
  const supabase = await createClient();
  await supabase.from("crm_notifications").delete().eq("id", id).eq("user_id", profile.id);
  revalidatePath("/contractor/notifications");
}

export async function createSupportTicketAction(
  _prev: ContractorFormState,
  formData: FormData,
): Promise<ContractorFormState> {
  const { profile, company } = await getContractorContext();
  if (!company) return { error: "No company profile is linked to this account." };
  const subject = formString(formData, "subject");
  const description = formString(formData, "description");
  if (subject.length < 3) return { error: "Enter a subject." };
  if (description.length < 5) return { error: "Describe the issue." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_contractor_support_tickets")
    .insert({
      company_id: company.id,
      created_by: profile.id,
      subject,
      category: (formOptional(formData, "category") || "other") as SupportTicketCategory,
      priority: (formOptional(formData, "priority") || "medium") as SupportTicketPriority,
      status: "open",
    })
    .select("id, ticket_number")
    .single();
  if (error || !data) return { error: error?.message || "Unable to create the ticket." };

  let attachmentPath: string | null = null;
  let attachmentName: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const invalid = validateUpload(file);
    if (invalid) return { error: invalid };
    attachmentPath = storagePath(company.id, `support-${file.name}`);
    attachmentName = file.name;
    const { error: uploadError } = await supabase.storage
      .from("crm-documents")
      .upload(attachmentPath, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true });
    if (uploadError) return { error: uploadError.message };
  }

  await supabase.from("crm_contractor_support_messages").insert({
    ticket_id: data.id,
    author_id: profile.id,
    body: description,
    attachment_path: attachmentPath,
    attachment_name: attachmentName,
  });
  await logActivity(supabase, {
    companyId: company.id,
    userId: profile.id,
    type: "support_ticket",
    subject: "Support ticket created",
    description: `${data.ticket_number}: ${subject}`,
  });
  await notifyUser(
    profile.id,
    "support_ticket",
    "Support ticket created",
    `${data.ticket_number} was submitted.`,
    `/contractor/support/${data.id}`,
    "ticket",
    data.id,
  );
  await notifyAdmins(
    "support_ticket",
    `Support ticket from ${company.company_name}`,
    `${data.ticket_number}: ${subject}`,
    `/tickets/${data.id}`,
    company.id,
  );
  if (company.email) {
    const copy = emailCopy.supportCreated(company.company_name, data.ticket_number, subject);
    await sendEmail({ to: company.email, ...copy });
  }
  revalidateContractor(["/contractor/support"]);
  redirect(`/contractor/support/${data.id}`);
}

export async function replySupportTicketAction(
  _prev: ContractorFormState,
  formData: FormData,
): Promise<ContractorFormState> {
  const profile = await requireProfile();
  const ticketId = formString(formData, "ticket_id");
  const body = formString(formData, "body");
  if (!ticketId || body.length < 1) return { error: "Enter a reply." };

  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("crm_contractor_support_tickets")
    .select("*, company:crm_companies(id, company_name, email)")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) return { error: "Ticket not found." };

  const isStaff = isStaffRole(profile.role);
  if (!isStaff && profile.role !== "contractor") return { error: "You cannot reply to this ticket." };
  if (!isStaff && ticket.company_id !== profile.company_id) return { error: "You cannot reply to this ticket." };

  let attachmentPath: string | null = null;
  let attachmentName: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const invalid = validateUpload(file);
    if (invalid) return { error: invalid };
    attachmentPath = storagePath(ticket.company_id, `support-${file.name}`);
    attachmentName = file.name;
    const { error: uploadError } = await supabase.storage
      .from("crm-documents")
      .upload(attachmentPath, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true });
    if (uploadError) return { error: uploadError.message };
  }

  const { error } = await supabase.from("crm_contractor_support_messages").insert({
    ticket_id: ticketId,
    author_id: profile.id,
    body,
    attachment_path: attachmentPath,
    attachment_name: attachmentName,
  });
  if (error) return { error: error.message };

  if (ticket.status === "closed" && isStaff) {
    await supabase.from("crm_contractor_support_tickets").update({ status: "in_progress" }).eq("id", ticketId);
  } else if (isStaff && ticket.status === "open") {
    await supabase.from("crm_contractor_support_tickets").update({ status: "in_progress" }).eq("id", ticketId);
  }

  const company = ticket.company as { id: string; company_name: string; email: string | null } | null;
  if (isStaff) {
    const { data: owner } = await supabase.from("crm_profiles").select("id, email").eq("id", ticket.created_by).maybeSingle();
    if (owner) {
      await notifyUser(
        owner.id,
        "support_reply",
        "Support ticket reply",
        `UBBIM replied to ${ticket.ticket_number}.`,
        `/contractor/support/${ticketId}`,
        "ticket",
        ticketId,
      );
      const email = owner.email || company?.email;
      if (email) {
        const copy = emailCopy.supportReply(company?.company_name || "Contractor", ticket.ticket_number, body);
        await sendEmail({ to: email, ...copy });
      }
    }
  } else {
    await notifyAdmins(
      "support_reply",
      `Contractor replied: ${ticket.ticket_number}`,
      body.slice(0, 180),
      `/tickets/${ticketId}`,
      ticket.company_id,
    );
  }

  revalidatePath(`/contractor/support/${ticketId}`);
  revalidatePath("/contractor/support");
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  return { ok: true, message: "Reply sent." };
}

export async function closeSupportTicketAction(formData: FormData) {
  const profile = await requireProfile();
  const ticketId = formString(formData, "ticket_id");
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("crm_contractor_support_tickets")
    .select("id, company_id, created_by")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) throw new Error("Ticket not found.");
  const isStaff = isStaffRole(profile.role);
  if (!isStaff && ticket.company_id !== profile.company_id) throw new Error("You cannot close this ticket.");
  await supabase.from("crm_contractor_support_tickets").update({ status: "closed" }).eq("id", ticketId);
  revalidatePath(`/contractor/support/${ticketId}`);
  revalidatePath("/contractor/support");
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}

export async function updateSupportTicketStatusAction(formData: FormData) {
  const profile = await requireProfile();
  if (!isStaffRole(profile.role)) throw new Error("Only staff can update ticket status.");
  const ticketId = formString(formData, "ticket_id");
  const status = formString(formData, "status") as SupportTicketStatus;
  const supabase = await createClient();
  await supabase
    .from("crm_contractor_support_tickets")
    .update({ status, assigned_to: profile.id })
    .eq("id", ticketId);
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}

export async function updateContractorAccountAction(
  _prev: ContractorFormState,
  formData: FormData,
): Promise<ContractorFormState> {
  const profile = await requireRole(["contractor"]);
  const phone = formOptional(formData, "phone");
  const supabase = await createClient();
  const { error } = await supabase.from("crm_profiles").update({ phone }).eq("id", profile.id);
  if (error) return { error: error.message };
  revalidatePath("/contractor/settings");
  return { ok: true, message: "Account details saved." };
}

export async function changeContractorPasswordAction(
  _prev: ContractorFormState,
  formData: FormData,
): Promise<ContractorFormState> {
  const profile = await requireRole(["contractor"]);
  const current = formString(formData, "current_password");
  const password = formString(formData, "password");
  const confirm = formString(formData, "confirm_password");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };
  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signInWithPassword({ email: profile.email, password: current });
  if (authError) return { error: "Current password is incorrect." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { ok: true, message: "Password updated." };
}

export async function requestContractorPasswordResetFromSettingsAction() {
  const profile = await requireRole(["contractor"]);
  const supabase = await createClient();
  const redirectTo = `${getAppUrl()}/auth/callback?next=/contractor/reset-password`;
  await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo });
  const copy = emailCopy.passwordReset(redirectTo);
  await sendEmail({
    to: profile.email,
    subject: copy.subject,
    heading: copy.heading,
    bodyHtml: copy.bodyHtml,
    ctaLabel: "Reset password",
    ctaUrl: redirectTo,
  });
  revalidatePath("/contractor/settings");
  redirect("/contractor/settings?reset=1");
}

export async function saveContractorNotificationSettingsAction(formData: FormData) {
  const profile = await requireRole(["contractor"]);
  const supabase = await createClient();
  await supabase.from("crm_contractor_notification_settings").upsert({
    user_id: profile.id,
    email_notifications: formData.get("email_notifications") === "on",
    document_expiry_alerts: formData.get("document_expiry_alerts") === "on",
    payment_notifications: formData.get("payment_notifications") === "on",
    project_notifications: formData.get("project_notifications") === "on",
    support_notifications: formData.get("support_notifications") === "on",
  });
  revalidatePath("/contractor/settings");
}

export async function reviewContractorDocumentAction(formData: FormData) {
  const profile = await requireProfile();
  if (!isStaffRole(profile.role) || profile.role === "management") {
    throw new Error("You cannot review documents.");
  }
  const id = formString(formData, "id");
  const companyId = formString(formData, "company_id");
  const decision = formString(formData, "decision");
  const reason = formOptional(formData, "reason");
  if (decision !== "approved" && decision !== "rejected") throw new Error("Choose approve or reject.");
  if (decision === "rejected" && !reason) throw new Error("Enter a rejection reason.");

  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from("crm_documents")
    .update({
      review_status: decision,
      review_reason: reason,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("document_name, company_id, company:crm_companies(company_name, email)")
    .single();
  if (error) throw new Error(error.message);

  const { data: owners } = await supabase
    .from("crm_profiles")
    .select("id, email")
    .eq("company_id", document.company_id)
    .eq("role", "contractor");
  const rawCompany = document.company as { company_name: string; email: string | null } | { company_name: string; email: string | null }[] | null;
  const company = Array.isArray(rawCompany) ? rawCompany[0] : rawCompany;
  for (const owner of owners ?? []) {
    await notifyUser(
      owner.id,
      decision === "approved" ? "document_approved" : "document_rejected",
      decision === "approved" ? "Document approved" : "Document rejected",
      `${document.document_name} was ${decision}.${reason ? ` ${reason}` : ""}`,
      "/contractor/documents",
      "document",
      id,
    );
  }
  const email = owners?.[0]?.email || company?.email;
  if (email) {
    const copy =
      decision === "approved"
        ? emailCopy.documentApproved(company?.company_name || "Contractor", document.document_name)
        : emailCopy.documentRejected(company?.company_name || "Contractor", document.document_name, reason);
    await sendEmail({ to: email, ...copy });
  }
  await logActivity(supabase, {
    companyId: document.company_id,
    userId: profile.id,
    type: "document_update",
    subject: decision === "approved" ? "Document approved" : "Document rejected",
    description: document.document_name,
  });
  revalidatePath(`/vendors/${companyId}`);
  revalidatePath("/contractor/documents");
}

export async function getStaffDocumentUrlAction(documentId: string) {
  const profile = await requireProfile();
  if (!isStaffRole(profile.role)) return { error: "Not allowed." };
  const supabase = await createClient();
  const { data } = await supabase.from("crm_documents").select("file_path").eq("id", documentId).maybeSingle();
  if (!data?.file_path) return { error: "Document not found." };
  const { data: signed, error } = await supabase.storage.from("crm-documents").createSignedUrl(data.file_path, 60);
  if (error || !signed?.signedUrl) return { error: error?.message || "Unable to create a download link." };
  return { url: signed.signedUrl };
}
