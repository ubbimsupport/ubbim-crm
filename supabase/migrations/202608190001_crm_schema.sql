-- UBBIM Corporate CRM — schema, enums, tables, indexes
-- Project: UBBIM CRM

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;

create schema if not exists crm_private;

revoke all on schema crm_private from public;
grant usage on schema crm_private to postgres, service_role, authenticated;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.crm_user_role as enum ('super_admin', 'admin', 'staff', 'management');
create type public.crm_company_kind as enum ('vendor', 'contractor');
create type public.crm_company_status as enum ('pending', 'active', 'inactive', 'rejected', 'expired');
create type public.crm_document_status as enum ('active', 'expiring_soon', 'expired');
create type public.crm_project_status as enum ('planning', 'active', 'on_hold', 'completed', 'cancelled');
create type public.crm_activity_type as enum (
  'call', 'email', 'meeting', 'site_visit', 'follow_up',
  'document_update', 'project_update', 'note'
);
create type public.crm_activity_status as enum ('open', 'completed', 'cancelled');
create type public.crm_payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'cancelled');
create type public.crm_payment_type as enum ('registration', 'service', 'subscription', 'invoice');
create type public.crm_invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');
create type public.crm_subscription_status as enum ('incomplete', 'trialing', 'active', 'past_due', 'cancelled');
create type public.crm_notification_type as enum (
  'new_registration',
  'registration_approval',
  'registration_rejection',
  'expiring_document',
  'expired_document',
  'new_project',
  'project_deadline',
  'payment_successful',
  'payment_failed',
  'follow_up_reminder',
  'system'
);

-- ---------------------------------------------------------------------------
-- Sequences for human-readable IDs
-- ---------------------------------------------------------------------------

create sequence public.crm_vendor_seq start 1;
create sequence public.crm_contractor_seq start 1;
create sequence public.crm_project_seq start 1;
create sequence public.crm_document_seq start 1;
create sequence public.crm_invoice_seq start 1;
create sequence public.crm_payment_seq start 1;
create sequence public.crm_activity_seq start 1;

-- ---------------------------------------------------------------------------
-- Roles catalog
-- ---------------------------------------------------------------------------

create table public.crm_roles (
  id uuid primary key default gen_random_uuid(),
  name public.crm_user_role not null unique,
  display_name text not null,
  description text,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profiles (authorization source of truth — never use user_metadata)
-- ---------------------------------------------------------------------------

create table public.crm_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  role public.crm_user_role not null default 'staff',
  avatar_url text,
  job_title text,
  department text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_profiles_role_idx on public.crm_profiles (role);
create index crm_profiles_email_idx on public.crm_profiles (email);
create index crm_profiles_is_active_idx on public.crm_profiles (is_active);

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

create table public.crm_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind public.crm_company_kind not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, kind)
);

create index crm_categories_kind_idx on public.crm_categories (kind);

-- ---------------------------------------------------------------------------
-- Companies (shared vendor/contractor profile)
-- ---------------------------------------------------------------------------

create table public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  company_code text not null unique,
  company_name text not null,
  registration_number text,
  company_kind public.crm_company_kind not null,
  company_type text,
  category_id uuid references public.crm_categories (id) on delete set null,
  contact_person text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  postcode text,
  country text not null default 'Malaysia',
  website text,
  pic_id uuid references public.crm_profiles (id) on delete set null,
  status public.crm_company_status not null default 'pending',
  registration_date date,
  expiry_date date,
  rating numeric(3,2) check (rating is null or (rating >= 0 and rating <= 5)),
  remarks text,
  created_by uuid references public.crm_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_companies_kind_idx on public.crm_companies (company_kind);
create index crm_companies_status_idx on public.crm_companies (status);
create index crm_companies_category_id_idx on public.crm_companies (category_id);
create index crm_companies_pic_id_idx on public.crm_companies (pic_id);
create index crm_companies_created_by_idx on public.crm_companies (created_by);
create index crm_companies_state_idx on public.crm_companies (state);
create index crm_companies_expiry_date_idx on public.crm_companies (expiry_date);
create index crm_companies_company_name_idx on public.crm_companies (company_name);
create index crm_companies_registration_number_idx on public.crm_companies (registration_number);

-- ---------------------------------------------------------------------------
-- Vendors
-- ---------------------------------------------------------------------------

create table public.crm_vendors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.crm_companies (id) on delete cascade,
  vendor_code text not null unique,
  specialization text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_vendors_company_id_idx on public.crm_vendors (company_id);

-- ---------------------------------------------------------------------------
-- Contractors
-- ---------------------------------------------------------------------------

create table public.crm_contractors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.crm_companies (id) on delete cascade,
  contractor_code text not null unique,
  cidb_grade text,
  cidb_registration_number text,
  cidb_expiry_date date,
  specialization text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_contractors_company_id_idx on public.crm_contractors (company_id);
create index crm_contractors_cidb_expiry_idx on public.crm_contractors (cidb_expiry_date);

-- ---------------------------------------------------------------------------
-- Staff assignments (restricts staff to authorized companies)
-- ---------------------------------------------------------------------------

create table public.crm_company_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.crm_companies (id) on delete cascade,
  user_id uuid not null references public.crm_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index crm_company_assignments_company_id_idx on public.crm_company_assignments (company_id);
create index crm_company_assignments_user_id_idx on public.crm_company_assignments (user_id);

-- ---------------------------------------------------------------------------
-- Contacts
-- ---------------------------------------------------------------------------

create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.crm_companies (id) on delete cascade,
  full_name text not null,
  position text,
  department text,
  phone text,
  email text,
  whatsapp text,
  is_primary boolean not null default false,
  remarks text,
  created_by uuid references public.crm_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_contacts_company_id_idx on public.crm_contacts (company_id);
create index crm_contacts_created_by_idx on public.crm_contacts (created_by);
create unique index crm_contacts_one_primary_idx
  on public.crm_contacts (company_id)
  where is_primary;

-- ---------------------------------------------------------------------------
-- Document types
-- ---------------------------------------------------------------------------

create table public.crm_document_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  requires_expiry boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------

create table public.crm_documents (
  id uuid primary key default gen_random_uuid(),
  document_code text not null unique,
  company_id uuid not null references public.crm_companies (id) on delete cascade,
  document_type_id uuid references public.crm_document_types (id) on delete set null,
  document_name text not null,
  document_number text,
  issue_date date,
  expiry_date date,
  status public.crm_document_status not null default 'active',
  file_path text,
  file_url text,
  file_name text,
  mime_type text,
  file_size bigint,
  uploaded_by uuid references public.crm_profiles (id) on delete set null,
  uploaded_at timestamptz not null default now(),
  reminder_90_sent_at timestamptz,
  reminder_60_sent_at timestamptz,
  reminder_30_sent_at timestamptz,
  reminder_expired_sent_at timestamptz,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_documents_company_id_idx on public.crm_documents (company_id);
create index crm_documents_type_id_idx on public.crm_documents (document_type_id);
create index crm_documents_status_idx on public.crm_documents (status);
create index crm_documents_expiry_date_idx on public.crm_documents (expiry_date);
create index crm_documents_uploaded_by_idx on public.crm_documents (uploaded_by);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

create table public.crm_projects (
  id uuid primary key default gen_random_uuid(),
  project_code text not null unique,
  project_name text not null,
  project_number text,
  client_name text,
  vendor_id uuid references public.crm_companies (id) on delete set null,
  contractor_id uuid references public.crm_companies (id) on delete set null,
  project_manager_id uuid references public.crm_profiles (id) on delete set null,
  start_date date,
  end_date date,
  project_value numeric(14,2) not null default 0,
  currency text not null default 'MYR',
  location text,
  status public.crm_project_status not null default 'planning',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  description text,
  remarks text,
  created_by uuid references public.crm_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_projects_vendor_id_idx on public.crm_projects (vendor_id);
create index crm_projects_contractor_id_idx on public.crm_projects (contractor_id);
create index crm_projects_pm_id_idx on public.crm_projects (project_manager_id);
create index crm_projects_status_idx on public.crm_projects (status);
create index crm_projects_created_by_idx on public.crm_projects (created_by);
create index crm_projects_end_date_idx on public.crm_projects (end_date);
create index crm_projects_project_name_idx on public.crm_projects (project_name);

create table public.crm_project_companies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.crm_projects (id) on delete cascade,
  company_id uuid not null references public.crm_companies (id) on delete cascade,
  role text not null default 'participant',
  created_at timestamptz not null default now(),
  unique (project_id, company_id)
);

create index crm_project_companies_project_id_idx on public.crm_project_companies (project_id);
create index crm_project_companies_company_id_idx on public.crm_project_companies (company_id);

-- ---------------------------------------------------------------------------
-- Activities
-- ---------------------------------------------------------------------------

create table public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  activity_code text not null unique,
  company_id uuid references public.crm_companies (id) on delete cascade,
  project_id uuid references public.crm_projects (id) on delete set null,
  user_id uuid references public.crm_profiles (id) on delete set null,
  activity_type public.crm_activity_type not null default 'note',
  subject text not null,
  description text,
  activity_date timestamptz not null default now(),
  follow_up_date date,
  status public.crm_activity_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_activities_company_id_idx on public.crm_activities (company_id);
create index crm_activities_project_id_idx on public.crm_activities (project_id);
create index crm_activities_user_id_idx on public.crm_activities (user_id);
create index crm_activities_type_idx on public.crm_activities (activity_type);
create index crm_activities_status_idx on public.crm_activities (status);
create index crm_activities_date_idx on public.crm_activities (activity_date desc);
create index crm_activities_follow_up_idx on public.crm_activities (follow_up_date);

-- ---------------------------------------------------------------------------
-- Internal notes
-- ---------------------------------------------------------------------------

create table public.crm_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.crm_companies (id) on delete cascade,
  author_id uuid references public.crm_profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_notes_company_id_idx on public.crm_notes (company_id);
create index crm_notes_author_id_idx on public.crm_notes (author_id);

-- ---------------------------------------------------------------------------
-- Invoices, payments, subscriptions
-- ---------------------------------------------------------------------------

create table public.crm_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_code text not null unique,
  company_id uuid references public.crm_companies (id) on delete set null,
  project_id uuid references public.crm_projects (id) on delete set null,
  issued_to_user_id uuid references public.crm_profiles (id) on delete set null,
  description text,
  amount numeric(14,2) not null,
  currency text not null default 'MYR',
  status public.crm_invoice_status not null default 'draft',
  due_date date,
  issued_at timestamptz,
  paid_at timestamptz,
  created_by uuid references public.crm_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_invoices_company_id_idx on public.crm_invoices (company_id);
create index crm_invoices_project_id_idx on public.crm_invoices (project_id);
create index crm_invoices_user_id_idx on public.crm_invoices (issued_to_user_id);
create index crm_invoices_status_idx on public.crm_invoices (status);
create index crm_invoices_created_by_idx on public.crm_invoices (created_by);

create table public.crm_payments (
  id uuid primary key default gen_random_uuid(),
  payment_code text not null unique,
  company_id uuid references public.crm_companies (id) on delete set null,
  invoice_id uuid references public.crm_invoices (id) on delete set null,
  user_id uuid references public.crm_profiles (id) on delete set null,
  payment_type public.crm_payment_type not null default 'service',
  amount numeric(14,2) not null,
  currency text not null default 'MYR',
  status public.crm_payment_status not null default 'pending',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  receipt_url text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  remarks text,
  created_by uuid references public.crm_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_payments_company_id_idx on public.crm_payments (company_id);
create index crm_payments_invoice_id_idx on public.crm_payments (invoice_id);
create index crm_payments_user_id_idx on public.crm_payments (user_id);
create index crm_payments_status_idx on public.crm_payments (status);
create index crm_payments_type_idx on public.crm_payments (payment_type);
create index crm_payments_created_at_idx on public.crm_payments (created_at desc);
create index crm_payments_created_by_idx on public.crm_payments (created_by);

create table public.crm_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.crm_companies (id) on delete set null,
  user_id uuid references public.crm_profiles (id) on delete set null,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status public.crm_subscription_status not null default 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_subscriptions_company_id_idx on public.crm_subscriptions (company_id);
create index crm_subscriptions_user_id_idx on public.crm_subscriptions (user_id);
create index crm_subscriptions_status_idx on public.crm_subscriptions (status);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

create table public.crm_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.crm_profiles (id) on delete cascade,
  type public.crm_notification_type not null default 'system',
  title text not null,
  body text,
  link text,
  entity_type text,
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index crm_notifications_user_id_idx on public.crm_notifications (user_id);
create index crm_notifications_unread_idx on public.crm_notifications (user_id, is_read, created_at desc);
create index crm_notifications_created_at_idx on public.crm_notifications (created_at desc);

-- ---------------------------------------------------------------------------
-- Audit logs
-- ---------------------------------------------------------------------------

create table public.crm_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.crm_profiles (id) on delete set null,
  action text not null,
  module text not null,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index crm_audit_logs_user_id_idx on public.crm_audit_logs (user_id);
create index crm_audit_logs_module_idx on public.crm_audit_logs (module);
create index crm_audit_logs_record_id_idx on public.crm_audit_logs (record_id);
create index crm_audit_logs_created_at_idx on public.crm_audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------

create table public.crm_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.crm_profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create index crm_settings_updated_by_idx on public.crm_settings (updated_by);
