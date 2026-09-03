import { NextResponse } from "next/server";
import { emailCopy, sendEmail } from "@/lib/email/send";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasAdminClient()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for expiry jobs." }, { status: 500 });
  }

  const admin = createAdminClient();
  await admin.rpc("crm_refresh_document_statuses");
  const { data: documents } = await admin
    .from("crm_documents")
    .select("*, company:crm_companies(id, company_name, email, pic_id)")
    .not("expiry_date", "is", null);

  const today = new Date();
  const inDays = (date: string) => Math.ceil((new Date(date).getTime() - today.getTime()) / 86400000);
  let sent = 0;

  for (const doc of documents ?? []) {
    if (!doc.expiry_date) continue;
    const days = inDays(doc.expiry_date);
    let field: "reminder_90_sent_at" | "reminder_60_sent_at" | "reminder_30_sent_at" | "reminder_expired_sent_at" | null = null;
    let when = "";
    if (days <= 0 && !doc.reminder_expired_sent_at) {
      field = "reminder_expired_sent_at";
      when = "expired";
    } else if (days <= 30 && days > 0 && !doc.reminder_30_sent_at) {
      field = "reminder_30_sent_at";
      when = "due in 30 days or less";
    } else if (days <= 60 && days > 30 && !doc.reminder_60_sent_at) {
      field = "reminder_60_sent_at";
      when = "due in 60 days or less";
    } else if (days <= 90 && days > 60 && !doc.reminder_90_sent_at) {
      field = "reminder_90_sent_at";
      when = "due in 90 days or less";
    }
    if (!field) continue;

    const copy = emailCopy.documentExpiry(doc.company?.company_name || "company", doc.document_name, `${when} (${formatDate(doc.expiry_date)})`);
    if (doc.company?.email) await sendEmail({ to: doc.company.email, ...copy });

    const { data: owners } = await admin.from("crm_profiles").select("id, email").eq("company_id", doc.company_id).eq("role", "contractor");
    for (const owner of owners ?? []) {
      await admin.from("crm_notifications").insert({
        user_id: owner.id,
        type: days <= 0 ? "expired_document" : "expiring_document",
        title: days <= 0 ? "Document expired" : "Document expiring soon",
        body: `${doc.document_name} for ${doc.company?.company_name} is ${when}.`,
        link: "/contractor/documents",
        entity_type: "document",
        entity_id: doc.id,
      });
    }
    const { data: admins } = await admin.from("crm_profiles").select("id, email").in("role", ["super_admin", "admin"]).eq("is_active", true);
    for (const user of admins ?? []) {
      await admin.from("crm_notifications").insert({
        user_id: user.id,
        type: days <= 0 ? "expired_document" : "expiring_document",
        title: days <= 0 ? "Document expired" : "Document expiring soon",
        body: `${doc.document_name} for ${doc.company?.company_name} is ${when}.`,
        link: "/dashboard",
        entity_type: "document",
        entity_id: doc.id,
      });
      if (user.email) await sendEmail({ to: user.email, ...copy });
    }
    await admin.from("crm_documents").update({ [field]: new Date().toISOString() }).eq("id", doc.id);
    sent += 1;
  }

  const { data: followUps } = await admin
    .from("crm_activities")
    .select("id, subject, user_id, follow_up_date, company:crm_companies(company_name)")
    .eq("status", "open")
    .lte("follow_up_date", today.toISOString().slice(0, 10));
  for (const activity of followUps ?? []) {
    if (!activity.user_id) continue;
    await admin.from("crm_notifications").insert({
      user_id: activity.user_id,
      type: "follow_up_reminder",
      title: "Follow-up due",
      body: activity.subject,
      link: "/activities",
      entity_type: "activity",
      entity_id: activity.id,
    });
  }

  return NextResponse.json({ ok: true, reminders: sent });
}
