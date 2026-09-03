import type {
  ActivityType,
  CompanyKind,
  CompanyStatus,
  DocumentReviewStatus,
  DocumentStatus,
  PaymentStatus,
  PaymentType,
  ProjectStatus,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
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

export const CIDB_CATEGORIES = [
  "CE - Civil Engineering",
  "B - Building",
  "ME - Mechanical & Electrical",
  "CE21 - Road & Pavement",
  "CE36 - Earthworks",
  "B04 - Building Construction",
  "Other",
] as const;

export const ROLES: { value: UserRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "management", label: "Management" },
  { value: "user", label: "User" },
  { value: "contractor", label: "Contractor" },
];

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

export const DOCUMENT_REVIEW_STATUSES: { value: DocumentReviewStatus; label: string }[] = [
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export const SUPPORT_CATEGORIES: { value: SupportTicketCategory; label: string }[] = [
  { value: "account", label: "Account" },
  { value: "registration", label: "Registration" },
  { value: "documents", label: "Documents" },
  { value: "payment", label: "Payment" },
  { value: "project", label: "Project" },
  { value: "technical_support", label: "Technical Support" },
  { value: "other", label: "Other" },
];

export const SUPPORT_PRIORITIES: { value: SupportTicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const SUPPORT_STATUSES: { value: SupportTicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

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
  { value: "profile_update", label: "Profile Updated" },
  { value: "document_uploaded", label: "Document Uploaded" },
  { value: "payment_completed", label: "Payment Completed" },
  { value: "support_ticket", label: "Support Ticket" },
  { value: "project_assigned", label: "Project Assigned" },
];

export const COMPANY_KINDS: { value: CompanyKind; label: string }[] = [
  { value: "vendor", label: "Vendor" },
  { value: "contractor", label: "Contractor" },
];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: ["super_admin", "admin", "staff", "management"] },
  { href: "/user/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: ["user"] },
  { href: "/contractor/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: ["contractor"] },
  { href: "/contractor/company", label: "My Company", icon: "Building2", roles: ["contractor"] },
  { href: "/contractor/documents", label: "Documents", icon: "FileStack", roles: ["contractor"] },
  { href: "/contractor/projects", label: "Projects", icon: "FolderKanban", roles: ["contractor"] },
  { href: "/contractor/payments", label: "Payments", icon: "CreditCard", roles: ["contractor"] },
  { href: "/contractor/activities", label: "Activities", icon: "ListTodo", roles: ["contractor"] },
  { href: "/contractor/notifications", label: "Notifications", icon: "Bell", roles: ["contractor"] },
  { href: "/contractor/support", label: "Support", icon: "LifeBuoy", roles: ["contractor"] },
  { href: "/contractor/settings", label: "Settings", icon: "Settings", roles: ["contractor"] },
  { href: "/vendors", label: "Vendor", icon: "Building2", roles: ["super_admin", "admin", "staff", "management"] },
  { href: "/tickets", label: "Support tickets", icon: "LifeBuoy", roles: ["super_admin", "admin", "staff"] },
  { href: "/contacts", label: "Contacts", icon: "Users", roles: ["super_admin", "admin", "staff", "management"] },
  { href: "/projects", label: "Projects", icon: "FolderKanban", roles: ["super_admin", "admin", "staff", "management"] },
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

export const CONTRACTOR_NAV_ITEMS = [
  { href: "/contractor/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/contractor/company", label: "My Company", icon: "Building2" },
  { href: "/contractor/documents", label: "Documents", icon: "FileStack" },
  { href: "/contractor/projects", label: "Projects", icon: "FolderKanban" },
  { href: "/contractor/payments", label: "Payments", icon: "CreditCard" },
  { href: "/contractor/activities", label: "Activities", icon: "ListTodo" },
  { href: "/contractor/notifications", label: "Notifications", icon: "Bell" },
  { href: "/contractor/support", label: "Support", icon: "LifeBuoy" },
  { href: "/contractor/settings", label: "Settings", icon: "Settings" },
] as const;

export const CONTRACTOR_AUTH_PATHS = [
  "/contractor/login",
  "/contractor/register",
  "/contractor/forgot-password",
  "/contractor/reset-password",
] as const;
