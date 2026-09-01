import type {
  ActivityType,
  CompanyKind,
  CompanyStatus,
  FunnelStage,
  DocumentStatus,
  PaymentStatus,
  PaymentType,
  ProjectStatus,
  UserRole,
} from "@/lib/types";

export const APP_NAME = "UBBIM CRM";
export const APP_LEGAL_NAME = "UBBIM Corporate CRM";

export const MALAYSIAN_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "WP Kuala Lumpur",
  "WP Labuan",
  "WP Putrajaya",
] as const;

export const COMPANY_TYPES = [
  "Sdn Bhd",
  "Bhd",
  "Sole Proprietor",
  "Partnership",
  "LLP",
  "Other",
] as const;

export const CIDB_GRADES = ["G1", "G2", "G3", "G4", "G5", "G6", "G7"] as const;

export const ROLES: { value: UserRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "management", label: "Management" },
  { value: "user", label: "User" },
  { value: "contractor", label: "Contractor" },
];

export const FUNNEL_STAGES: { value: FunnelStage; label: string }[] = [
  { value: "inquiry", label: "Inquiry" },
  { value: "registered", label: "Registered" },
  { value: "documents", label: "Documents" },
  { value: "payment", label: "Payment" },
  { value: "review", label: "Review" },
  { value: "approved", label: "Approved" },
  { value: "onboarded", label: "Onboarded" },
  { value: "lost", label: "Lost" },
];

export function funnelStageForStatus(status: CompanyStatus): FunnelStage | null {
  switch (status) {
    case "active":
      return "approved";
    case "rejected":
    case "inactive":
    case "expired":
      return "lost";
    case "pending":
      return "registered";
    default:
      return null;
  }
}

export const COMPANY_STATUSES: { value: CompanyStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const DOCUMENT_STATUSES: { value: DocumentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
];

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
];

export const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: "registration", label: "Registration" },
  { value: "service", label: "Service" },
  { value: "subscription", label: "Subscription" },
  { value: "invoice", label: "Invoice" },
];

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "site_visit", label: "Site Visit" },
  { value: "follow_up", label: "Follow-up" },
  { value: "document_update", label: "Document Update" },
  { value: "project_update", label: "Project Update" },
  { value: "note", label: "Note" },
];

export const COMPANY_KINDS: { value: CompanyKind; label: string }[] = [
  { value: "vendor", label: "Vendor" },
  { value: "contractor", label: "Contractor" },
];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: ["super_admin", "admin", "staff", "management"] },
  { href: "/user/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: ["user"] },
  { href: "/contractor/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: ["contractor"] },
  { href: "/vendors", label: "Vendor", icon: "Building2", roles: ["super_admin", "admin", "staff", "management"] },
  { href: "/contacts", label: "Contacts", icon: "Users", roles: ["super_admin", "admin", "staff", "management"] },
  { href: "/projects", label: "Projects", icon: "FolderKanban", roles: ["super_admin", "admin", "staff", "management"] },
  { href: "/documents", label: "Documents", icon: "FileText", roles: ["super_admin", "admin", "staff", "management"] },
  { href: "/activities", label: "Activities", icon: "ListTodo", roles: ["super_admin", "admin", "staff", "management"] },
  { href: "/payments", label: "Payments", icon: "CreditCard", roles: ["super_admin", "admin", "management"] },
  { href: "/notifications", label: "Notifications", icon: "Bell", roles: ["super_admin", "admin", "staff", "management"] },
  { href: "/reports", label: "Reports", icon: "BarChart3", roles: ["super_admin", "admin", "management"] },
  { href: "/users", label: "Users", icon: "Shield", roles: ["super_admin"] },
  { href: "/audit-logs", label: "Audit Logs", icon: "ScrollText", roles: ["super_admin"] },
  { href: "/settings", label: "Settings", icon: "Settings", roles: ["super_admin"] },
] as const;

export const WRITE_ROLES: UserRole[] = ["super_admin", "admin", "staff"];
export const ADMIN_ROLES: UserRole[] = ["super_admin", "admin"];
export const STAFF_ROLES: UserRole[] = ["super_admin", "admin", "staff", "management"];
export const PORTAL_ROLES: UserRole[] = ["user", "contractor"];
export const READ_ONLY_ROLES: UserRole[] = ["management"];
