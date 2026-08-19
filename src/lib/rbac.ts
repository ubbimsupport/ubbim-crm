import { ADMIN_ROLES, NAV_ITEMS } from "@/lib/constants";
import type { Profile, UserRole } from "@/lib/types";

export function canAccessPath(role: UserRole, href: string) {
  const item = NAV_ITEMS.find((nav) => href === nav.href || href.startsWith(`${nav.href}/`));
  if (!item) return true;
  return (item.roles as readonly string[]).includes(role);
}

export function canManageCompanies(role: UserRole) {
  return ADMIN_ROLES.includes(role);
}

export function canWriteRecords(role: UserRole) {
  return role !== "management";
}

export function canViewPayments(role: UserRole) {
  return role !== "staff";
}

export function canManageUsers(role: UserRole) {
  return role === "super_admin";
}

export function canManageSettings(role: UserRole) {
  return role === "super_admin";
}

export function canViewAudit(role: UserRole) {
  return role === "super_admin";
}

export function canGenerateReports(role: UserRole) {
  return role === "super_admin" || role === "admin" || role === "management";
}

export function isReadOnly(role: UserRole) {
  return role === "management";
}

export function roleLabel(role: UserRole) {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "admin":
      return "Admin";
    case "staff":
      return "Staff";
    case "management":
      return "Management";
  }
}

export function assertRole(profile: Profile | null, allowed: UserRole[]) {
  if (!profile || !profile.is_active || !allowed.includes(profile.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
}
