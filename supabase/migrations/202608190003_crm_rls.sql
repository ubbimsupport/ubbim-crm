-- UBBIM Corporate CRM — Row Level Security

alter table public.crm_roles enable row level security;
alter table public.crm_profiles enable row level security;
alter table public.crm_categories enable row level security;
alter table public.crm_companies enable row level security;
alter table public.crm_vendors enable row level security;
alter table public.crm_contractors enable row level security;
alter table public.crm_company_assignments enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_document_types enable row level security;
alter table public.crm_documents enable row level security;
alter table public.crm_projects enable row level security;
alter table public.crm_project_companies enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_notes enable row level security;
alter table public.crm_invoices enable row level security;
alter table public.crm_payments enable row level security;
alter table public.crm_subscriptions enable row level security;
alter table public.crm_notifications enable row level security;
alter table public.crm_audit_logs enable row level security;
alter table public.crm_settings enable row level security;

-- Roles catalog
create policy crm_roles_select on public.crm_roles
  for select to authenticated
  using ((select crm_private.is_active_user()));

create policy crm_roles_write on public.crm_roles
  for all to authenticated
  using ((select crm_private.is_super_admin()))
  with check ((select crm_private.is_super_admin()));

-- Profiles
create policy crm_profiles_select on public.crm_profiles
  for select to authenticated
  using (
    (select crm_private.is_active_user())
    or id = (select auth.uid())
  );

create policy crm_profiles_update_self on public.crm_profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy crm_profiles_admin_update on public.crm_profiles
  for update to authenticated
  using ((select crm_private.is_super_admin()))
  with check ((select crm_private.is_super_admin()));

create policy crm_profiles_admin_insert on public.crm_profiles
  for insert to authenticated
  with check ((select crm_private.is_super_admin()));

-- Categories (read for all staff; write admin+)
create policy crm_categories_select on public.crm_categories
  for select to authenticated
  using ((select crm_private.is_active_user()));

create policy crm_categories_select_anon on public.crm_categories
  for select to anon
  using (is_active = true);

create policy crm_categories_write on public.crm_categories
  for all to authenticated
  using ((select crm_private.is_admin_or_above()))
  with check ((select crm_private.is_admin_or_above()));

-- Companies
create policy crm_companies_select on public.crm_companies
  for select to authenticated
  using ((select crm_private.can_access_company(id)));

create policy crm_companies_insert on public.crm_companies
  for insert to authenticated
  with check ((select crm_private.is_admin_or_above()));

create policy crm_companies_update on public.crm_companies
  for update to authenticated
  using ((select crm_private.can_write_company(id)))
  with check ((select crm_private.can_write_company(id)));

create policy crm_companies_delete on public.crm_companies
  for delete to authenticated
  using ((select crm_private.is_super_admin()));

-- Vendors
create policy crm_vendors_select on public.crm_vendors
  for select to authenticated
  using ((select crm_private.can_access_company(company_id)));

create policy crm_vendors_insert on public.crm_vendors
  for insert to authenticated
  with check ((select crm_private.is_admin_or_above()));

create policy crm_vendors_update on public.crm_vendors
  for update to authenticated
  using ((select crm_private.can_write_company(company_id)))
  with check ((select crm_private.can_write_company(company_id)));

create policy crm_vendors_delete on public.crm_vendors
  for delete to authenticated
  using ((select crm_private.is_super_admin()));

-- Contractors
create policy crm_contractors_select on public.crm_contractors
  for select to authenticated
  using ((select crm_private.can_access_company(company_id)));

create policy crm_contractors_insert on public.crm_contractors
  for insert to authenticated
  with check ((select crm_private.is_admin_or_above()));

create policy crm_contractors_update on public.crm_contractors
  for update to authenticated
  using ((select crm_private.can_write_company(company_id)))
  with check ((select crm_private.can_write_company(company_id)));

create policy crm_contractors_delete on public.crm_contractors
  for delete to authenticated
  using ((select crm_private.is_super_admin()));

-- Assignments
create policy crm_assignments_select on public.crm_company_assignments
  for select to authenticated
  using (
    (select crm_private.is_admin_or_above())
    or user_id = (select auth.uid())
  );

create policy crm_assignments_write on public.crm_company_assignments
  for all to authenticated
  using ((select crm_private.is_admin_or_above()))
  with check ((select crm_private.is_admin_or_above()));

-- Contacts
create policy crm_contacts_select on public.crm_contacts
  for select to authenticated
  using ((select crm_private.can_access_company(company_id)));

create policy crm_contacts_insert on public.crm_contacts
  for insert to authenticated
  with check ((select crm_private.can_write_company(company_id)));

create policy crm_contacts_update on public.crm_contacts
  for update to authenticated
  using ((select crm_private.can_write_company(company_id)))
  with check ((select crm_private.can_write_company(company_id)));

create policy crm_contacts_delete on public.crm_contacts
  for delete to authenticated
  using ((select crm_private.can_write_company(company_id)));

-- Document types
create policy crm_document_types_select on public.crm_document_types
  for select to authenticated
  using ((select crm_private.is_active_user()));

create policy crm_document_types_write on public.crm_document_types
  for all to authenticated
  using ((select crm_private.is_admin_or_above()))
  with check ((select crm_private.is_admin_or_above()));

-- Documents
create policy crm_documents_select on public.crm_documents
  for select to authenticated
  using ((select crm_private.can_access_company(company_id)));

create policy crm_documents_insert on public.crm_documents
  for insert to authenticated
  with check ((select crm_private.can_write_company(company_id)));

create policy crm_documents_update on public.crm_documents
  for update to authenticated
  using ((select crm_private.can_write_company(company_id)))
  with check ((select crm_private.can_write_company(company_id)));

create policy crm_documents_delete on public.crm_documents
  for delete to authenticated
  using ((select crm_private.is_admin_or_above()));

-- Projects
create policy crm_projects_select on public.crm_projects
  for select to authenticated
  using (
    (select crm_private.is_admin_or_above())
    or (select crm_private.is_management())
    or (vendor_id is not null and (select crm_private.can_access_company(vendor_id)))
    or (contractor_id is not null and (select crm_private.can_access_company(contractor_id)))
  );

create policy crm_projects_insert on public.crm_projects
  for insert to authenticated
  with check ((select crm_private.is_admin_or_above()));

create policy crm_projects_update on public.crm_projects
  for update to authenticated
  using ((select crm_private.is_admin_or_above()))
  with check ((select crm_private.is_admin_or_above()));

create policy crm_projects_delete on public.crm_projects
  for delete to authenticated
  using ((select crm_private.is_super_admin()));

create policy crm_project_companies_select on public.crm_project_companies
  for select to authenticated
  using (
    (select crm_private.is_admin_or_above())
    or (select crm_private.is_management())
    or (select crm_private.can_access_company(company_id))
  );

create policy crm_project_companies_write on public.crm_project_companies
  for all to authenticated
  using ((select crm_private.is_admin_or_above()))
  with check ((select crm_private.is_admin_or_above()));

-- Activities
create policy crm_activities_select on public.crm_activities
  for select to authenticated
  using (
    company_id is null and (select crm_private.is_active_user())
    or (company_id is not null and (select crm_private.can_access_company(company_id)))
  );

create policy crm_activities_insert on public.crm_activities
  for insert to authenticated
  with check (
    (select crm_private.is_admin_or_above())
    or (company_id is not null and (select crm_private.can_write_company(company_id)))
  );

create policy crm_activities_update on public.crm_activities
  for update to authenticated
  using (
    (select crm_private.is_admin_or_above())
    or user_id = (select auth.uid())
  )
  with check (
    (select crm_private.is_admin_or_above())
    or user_id = (select auth.uid())
  );

create policy crm_activities_delete on public.crm_activities
  for delete to authenticated
  using ((select crm_private.is_admin_or_above()));

-- Notes
create policy crm_notes_select on public.crm_notes
  for select to authenticated
  using ((select crm_private.can_access_company(company_id)));

create policy crm_notes_insert on public.crm_notes
  for insert to authenticated
  with check ((select crm_private.can_write_company(company_id)));

create policy crm_notes_update on public.crm_notes
  for update to authenticated
  using (author_id = (select auth.uid()) or (select crm_private.is_admin_or_above()))
  with check (author_id = (select auth.uid()) or (select crm_private.is_admin_or_above()));

create policy crm_notes_delete on public.crm_notes
  for delete to authenticated
  using ((select crm_private.is_admin_or_above()));

-- Invoices / payments — staff can view assigned company payments only
create policy crm_invoices_select on public.crm_invoices
  for select to authenticated
  using (
    (select crm_private.is_admin_or_above())
    or (select crm_private.is_management())
    or (company_id is not null and (select crm_private.can_access_company(company_id)))
  );

create policy crm_invoices_write on public.crm_invoices
  for all to authenticated
  using ((select crm_private.is_super_admin()))
  with check ((select crm_private.is_super_admin()));

create policy crm_invoices_admin_insert on public.crm_invoices
  for insert to authenticated
  with check ((select crm_private.is_admin_or_above()));

create policy crm_payments_select on public.crm_payments
  for select to authenticated
  using (
    (select crm_private.is_admin_or_above())
    or (select crm_private.is_management())
    or user_id = (select auth.uid())
    or (company_id is not null and (select crm_private.can_access_company(company_id)))
  );

create policy crm_payments_insert on public.crm_payments
  for insert to authenticated
  with check (
    (select crm_private.is_admin_or_above())
    or user_id = (select auth.uid())
  );

create policy crm_payments_update on public.crm_payments
  for update to authenticated
  using ((select crm_private.is_super_admin()))
  with check ((select crm_private.is_super_admin()));

create policy crm_subscriptions_select on public.crm_subscriptions
  for select to authenticated
  using (
    (select crm_private.is_admin_or_above())
    or (select crm_private.is_management())
    or user_id = (select auth.uid())
    or (company_id is not null and (select crm_private.can_access_company(company_id)))
  );

create policy crm_subscriptions_write on public.crm_subscriptions
  for all to authenticated
  using ((select crm_private.is_super_admin()))
  with check ((select crm_private.is_super_admin()));

-- Notifications — own rows only
create policy crm_notifications_select on public.crm_notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy crm_notifications_update on public.crm_notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy crm_notifications_insert on public.crm_notifications
  for insert to authenticated
  with check (
    (select crm_private.is_admin_or_above())
    or user_id = (select auth.uid())
  );

-- Audit logs — super admin only
create policy crm_audit_select on public.crm_audit_logs
  for select to authenticated
  using ((select crm_private.is_super_admin()));

-- Settings
create policy crm_settings_select on public.crm_settings
  for select to authenticated
  using ((select crm_private.is_active_user()));

create policy crm_settings_write on public.crm_settings
  for all to authenticated
  using ((select crm_private.is_super_admin()))
  with check ((select crm_private.is_super_admin()));
