export type UserRole = "super_admin" | "admin" | "staff" | "management" | "user" | "contractor";
export type CompanyKind = "vendor" | "contractor";
export type CompanyStatus = "pending" | "active" | "inactive" | "rejected" | "expired";
export type FunnelStage =
  | "inquiry"
  | "registered"
  | "documents"
  | "payment"
  | "review"
  | "approved"
  | "onboarded"
  | "lost";
export type DocumentStatus = "active" | "expiring_soon" | "expired";
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";
export type ActivityType =
  | "call"
  | "email"
  | "meeting"
  | "site_visit"
  | "follow_up"
  | "document_update"
  | "project_update"
  | "note";
export type ActivityStatus = "open" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";
export type PaymentType = "registration" | "service" | "subscription" | "invoice";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type NotificationType =
  | "new_registration"
  | "registration_approval"
  | "registration_rejection"
  | "expiring_document"
  | "expired_document"
  | "new_project"
  | "project_deadline"
  | "payment_successful"
  | "payment_failed"
  | "follow_up_reminder"
  | "system";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  job_title: string | null;
  department: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  kind: CompanyKind;
  description: string | null;
  is_active: boolean;
};

export type Company = {
  id: string;
  company_code: string;
  company_name: string;
  registration_number: string | null;
  company_kind: CompanyKind;
  company_type: string | null;
  category_id: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string;
  website: string | null;
  pic_id: string | null;
  status: CompanyStatus;
  registration_date: string | null;
  expiry_date: string | null;
  rating: number | null;
  remarks: string | null;
  funnel_stage: FunnelStage;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  pic?: Profile | null;
  vendor?: Vendor | null;
  contractor?: Contractor | null;
};

export type Vendor = {
  id: string;
  company_id: string;
  vendor_code: string;
  specialization: string | null;
};

export type Contractor = {
  id: string;
  company_id: string;
  contractor_code: string;
  cidb_grade: string | null;
  cidb_registration_number: string | null;
  cidb_expiry_date: string | null;
  specialization: string | null;
};

export type Contact = {
  id: string;
  company_id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  is_primary: boolean;
  remarks: string | null;
  created_at: string;
  company?: Pick<Company, "id" | "company_name" | "company_code" | "company_kind"> | null;
};

export type DocumentType = {
  id: string;
  name: string;
  description: string | null;
  requires_expiry: boolean;
};

export type CrmDocument = {
  id: string;
  document_code: string;
  company_id: string;
  document_type_id: string | null;
  document_name: string;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: DocumentStatus;
  file_path: string | null;
  file_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
  remarks: string | null;
  company?: Pick<Company, "id" | "company_name" | "company_code" | "company_kind"> | null;
  document_type?: DocumentType | null;
  uploader?: Pick<Profile, "id" | "full_name"> | null;
};

export type Project = {
  id: string;
  project_code: string;
  project_name: string;
  project_number: string | null;
  client_name: string | null;
  vendor_id: string | null;
  contractor_id: string | null;
  project_manager_id: string | null;
  start_date: string | null;
  end_date: string | null;
  project_value: number;
  currency: string;
  location: string | null;
  status: ProjectStatus;
  progress: number;
  description: string | null;
  remarks: string | null;
  created_at: string;
  vendor?: Pick<Company, "id" | "company_name" | "company_code"> | null;
  contractor?: Pick<Company, "id" | "company_name" | "company_code"> | null;
  project_manager?: Pick<Profile, "id" | "full_name"> | null;
};

export type Activity = {
  id: string;
  activity_code: string;
  company_id: string | null;
  project_id: string | null;
  user_id: string | null;
  activity_type: ActivityType;
  subject: string;
  description: string | null;
  activity_date: string;
  follow_up_date: string | null;
  status: ActivityStatus;
  created_at: string;
  company?: Pick<Company, "id" | "company_name" | "company_code"> | null;
  user?: Pick<Profile, "id" | "full_name"> | null;
  project?: Pick<Project, "id" | "project_name" | "project_code"> | null;
};

export type Note = {
  id: string;
  company_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  author?: Pick<Profile, "id" | "full_name"> | null;
};

export type Payment = {
  id: string;
  payment_code: string;
  company_id: string | null;
  invoice_id: string | null;
  user_id: string | null;
  payment_type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  receipt_url: string | null;
  paid_at: string | null;
  remarks: string | null;
  created_at: string;
  company?: Pick<Company, "id" | "company_name" | "company_code"> | null;
  invoice?: { id: string; invoice_code: string } | null;
};

export type Invoice = {
  id: string;
  invoice_code: string;
  company_id: string | null;
  project_id: string | null;
  description: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  module: string;
  record_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user?: Pick<Profile, "id" | "full_name" | "email"> | null;
};

export type Setting = {
  key: string;
  value: unknown;
};

export type FunnelEvent = {
  id: string;
  company_id: string;
  stage: FunnelStage;
  note: string | null;
  created_by: string | null;
  created_at: string;
  creator?: Pick<Profile, "id" | "full_name"> | null;
};
