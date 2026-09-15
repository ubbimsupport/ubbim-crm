import { ADMIN_ROLES, NAV_ITEMS, PORTAL_ROLES, ROLES, STAFF_ROLES, WRITE_ROLES } from "@/lib/constants";
import type { CompanyKind, Profile, UserRole } from "@/lib/types";

export const VALID_ROLES = ROLES.map((item) => item.value);

export function isValidRole(role: string | null | undefined): role is UserRole {
  return Boolean(role && VALID_ROLES.includes(role as UserRole));
}

export function isStaffRole(role: UserRole) {
  return STAFF_ROLES.includes(role);
}

export function isPortalRole(role: UserRole) {
  return PORTAL_ROLES.includes(role);
}

export function isAdminDashboardRole(role: UserRole) {
  return isStaffRole(role);
}

export function homePathForRole(role: UserRole, companyKind?: CompanyKind | null) {
  if (role === "contractor") return "/contractor/dashboard";
  if (role === "user") {
    return companyKind === "vendor" ? "/vendor/dashboard" : "/user/dashboard";
  }
  if (isStaffRole(role)) return "/dashboard";
  return "/login?error=" + encodeURIComponent("This account does not have a valid role. Contact UBBIM.");
}

function isContractorPortalPath(path: string) {
  return path === "/contractor" || path.startsWith("/contractor/");
}

function isUserPortalPath(path: string) {
  return path === "/user" || path.startsWith("/user/");
}

function isVendorPortalPath(path: string) {
  return path === "/vendor" || path.startsWith("/vendor/");
}

export function canAccessPath(role: UserRole, href: string, companyKind?: CompanyKind | null) {
  const path = href.split("?")[0] || href;
  if (isContractorPortalPath(path)) return role === "contractor";
  if (isVendorPortalPath(path)) return role === "user" && companyKind === "vendor";
  if (isUserPortalPath(path)) return role === "user" && companyKind !== "vendor";
  const item = NAV_ITEMS.find((nav) => path === nav.href || path.startsWith(`${nav.href}/`));
  if (isPortalRole(role)) {
    return Boolean(item && (item.roles as readonly string[]).includes(role));
  }
  if (!item) return isStaffRole(role);
  return (item.roles as readonly string[]).includes(role);
}

export function canManageCompanies(role: UserRole) {
  return ADMIN_ROLES.includes(role);
}

export function canDeleteCompanies(role: UserRole) {
  return ADMIN_ROLES.includes(role);
}

export function canViewVendors(role: UserRole) {
  return STAFF_ROLES.includes(role);
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
