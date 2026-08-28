import { ADMIN_ROLES, NAV_ITEMS, PORTAL_ROLES, STAFF_ROLES, WRITE_ROLES } from "@/lib/constants";
import type { Profile, UserRole } from "@/lib/types";

export function isStaffRole(role: UserRole) {
  return STAFF_ROLES.includes(role);
}

export function isPortalRole(role: UserRole) {
  return PORTAL_ROLES.includes(role);
}

export function homePathForRole(role: UserRole) {
  if (role === "user") return "/user/dashboard";
  if (role === "contractor") return "/contractor/dashboard";
  return "/dashboard";
}

export function canAccessPath(role: UserRole, href: string) {
  const path = href.split("?")[0] || href;
  const item = NAV_ITEMS.find((nav) => path === nav.href || path.startsWith(`${nav.href}/`));
  if (!item) return isStaffRole(role);
  return (item.roles as readonly string[]).includes(role);
}

export function canManageCompanies(role: UserRole) {
  return ADMIN_ROLES.includes(role);
}

export function canWriteRecords(role: UserRole) {
  return WRITE_ROLES.includes(role);
}

export function canViewPayments(role: UserRole) {
  return role === "super_admin" || role === "admin" || role === "management";
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
    case "user":
      return "User";
    case "contractor":
      return "Contractor";
  }
}

export function assertRole(profile: Profile | null, allowed: UserRole[]) {
  if (!profile || !profile.is_active || !allowed.includes(profile.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
}
