import { cidbStatus } from "@/lib/contractor";
import type { CompanyStatus } from "@/lib/types";

export function displayInitials(value?: string | null) {
  const parts = (value ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function daysUntilDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

export function expiryBufferPercent(daysLeft: number | null) {
  if (daysLeft == null) return null;
  if (daysLeft <= 0) return 0;
  return Math.min(100, Math.round((daysLeft / 365) * 100));
}

export function cidbPermitLabel(expiry?: string | null) {
  const status = cidbStatus(expiry);
  if (status === "active") return "Active Sijil Perakuan";
  if (status === "expiring_soon") return "Expiring Sijil Perakuan";
  if (status === "expired") return "Expired Sijil Perakuan";
  return null;
}

export function companyRegistryLabel(status?: CompanyStatus | null) {
  if (!status) return null;
  if (status === "active") return "Active registry";
  if (status === "pending") return "Pending registry";
  if (status === "inactive") return "Inactive registry";
  if (status === "rejected") return "Rejected registry";
  if (status === "expired") return "Expired registry";
  return null;
}

export function specializationLines(input: {
  category?: string | null;
  specialization?: string | null;
}) {
  return [input.category, input.specialization]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}
