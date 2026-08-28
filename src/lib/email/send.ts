import nodemailer from "nodemailer";
import { APP_LEGAL_NAME, APP_NAME } from "@/lib/constants";

type EmailPayload = {
  to: string | string[];
  subject: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 4000,
  });
}

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

export function wrapTemplate(heading: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string) {
  const button = ctaLabel && ctaUrl
    ? `<p style="margin:28px 0 8px"><a href="${ctaUrl}" style="background:#0B3A5B;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;display:inline-block;font-weight:600">${ctaLabel}</a></p>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F4F6F8;font-family:Arial,Helvetica,sans-serif;color:#1F2933">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F8;padding:32px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB">
            <tr>
              <td style="background:#0B3A5B;padding:22px 32px">
                <div style="color:#C4A35A;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700">UBBIM</div>
                <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:4px">${APP_NAME}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px">
                <h1 style="margin:0 0 16px;font-size:22px;color:#0B3A5B">${heading}</h1>
                <div style="font-size:15px;line-height:1.6">${bodyHtml}</div>
                ${button}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background:#F8FAFC;color:#6B7280;font-size:12px">
                This is an automated message from ${APP_LEGAL_NAME}. Please do not reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendEmail(payload: EmailPayload) {
  const transporter = getTransport();
  if (!transporter) {
    console.warn("SMTP is not configured. Skipping email:", payload.subject);
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: payload.to,
    subject: payload.subject,
    html: wrapTemplate(payload.heading, payload.bodyHtml, payload.ctaLabel, payload.ctaUrl),
  });

  return { sent: true as const };
}

export const emailCopy = {
  welcome: (name: string) => ({
    subject: `Welcome to ${APP_NAME}`,
    heading: "Your account is ready",
    bodyHtml: `<p>Dear ${name},</p><p>Your UBBIM Corporate CRM account has been created. Sign in to manage vendors, contractors, documents, projects, and payments.</p>`,
  }),
  passwordReset: (url: string) => ({
    subject: `${APP_NAME} password reset`,
    heading: "Reset your password",
    bodyHtml: `<p>We received a request to reset your password. This link expires shortly. If you did not request this change, you can ignore this email.</p>`,
    ctaLabel: "Reset password",
    ctaUrl: url,
  }),
  registration: (company: string, kind: string) => ({
    subject: `${APP_NAME}: ${kind} registration received`,
    heading: "Registration received",
    bodyHtml: `<p>Thank you for registering <strong>${company}</strong> as a ${kind} with UBBIM. Sign in with the email and password you created. Our team will review your submission and notify you of the outcome.</p>`,
  }),
  registrationStaff: (company: string, kind: string) => ({
    subject: `New ${kind} registration: ${company}`,
    heading: "New registration pending review",
    bodyHtml: `<p><strong>${company}</strong> has submitted a ${kind} registration and is awaiting approval.</p>`,
  }),
  approval: (company: string) => ({
    subject: `${APP_NAME}: registration approved`,
    heading: "Registration approved",
    bodyHtml: `<p>The registration for <strong>${company}</strong> has been approved. You are now an active UBBIM partner.</p>`,
  }),
  rejection: (company: string, reason?: string) => ({
    subject: `${APP_NAME}: registration update`,
    heading: "Registration not approved",
    bodyHtml: `<p>The registration for <strong>${company}</strong> was not approved.${reason ? ` Reason: ${reason}` : ""}</p>`,
  }),
  documentExpiry: (company: string, document: string, when: string) => ({
    subject: `${APP_NAME}: document expiry reminder`,
    heading: "Document expiry reminder",
    bodyHtml: `<p>The document <strong>${document}</strong> for <strong>${company}</strong> is ${when}. Please upload a renewed copy to keep the company record compliant.</p>`,
  }),
  payment: (status: string, amount: string, reference: string) => ({
    subject: `${APP_NAME}: payment ${status}`,
    heading: `Payment ${status}`,
    bodyHtml: `<p>Payment <strong>${reference}</strong> for ${amount} is now <strong>${status}</strong>.</p>`,
  }),
  project: (name: string, message: string) => ({
    subject: `${APP_NAME}: project update`,
    heading: name,
    bodyHtml: `<p>${message}</p>`,
  }),
  system: (heading: string, message: string) => ({
    subject: `${APP_NAME}: ${heading}`,
    heading,
    bodyHtml: `<p>${message}</p>`,
  }),
};
