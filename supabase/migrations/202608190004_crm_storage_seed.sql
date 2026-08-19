-- UBBIM Corporate CRM — storage, realtime, seed data

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crm-documents',
  'crm-documents',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
)
on conflict (id) do nothing;

-- Path convention: {company_id}/{document_id}/{filename}
create policy crm_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'crm-documents'
    and (select crm_private.can_access_company(((storage.foldername(name))[1])::uuid))
  );

create policy crm_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'crm-documents'
    and (select crm_private.can_write_company(((storage.foldername(name))[1])::uuid))
  );

create policy crm_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'crm-documents'
    and (select crm_private.can_write_company(((storage.foldername(name))[1])::uuid))
  )
  with check (
    bucket_id = 'crm-documents'
    and (select crm_private.can_write_company(((storage.foldername(name))[1])::uuid))
  );

create policy crm_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'crm-documents'
    and (select crm_private.is_admin_or_above())
  );

-- Realtime notifications
alter table public.crm_notifications replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'crm_notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.crm_notifications';
  end if;
end;
$$;

-- Seed roles
insert into public.crm_roles (name, display_name, description, permissions) values
  ('super_admin', 'Super Admin', 'Full access to users, roles, vendors, contractors, projects, documents, payments, reports, settings, and audit logs.', '{"all": true}'::jsonb),
  ('admin', 'Admin', 'Manage vendors, contractors, documents, projects, and activities. View payments and generate reports.', '{"vendors": true, "contractors": true, "documents": true, "projects": true, "activities": true, "payments": "read", "reports": true}'::jsonb),
  ('staff', 'Staff', 'View assigned companies, update company information, add activities, upload documents, and manage contacts.', '{"assigned_companies": true}'::jsonb),
  ('management', 'Management', 'Read-only access to dashboard, vendors, contractors, projects, documents, payments, reports, and analytics.', '{"read_only": true}'::jsonb)
on conflict (name) do nothing;

-- Seed categories
insert into public.crm_categories (name, kind, description) values
  ('Building Materials', 'vendor', 'Cement, steel, aggregates, and related building supplies'),
  ('MEP Supplies', 'vendor', 'Mechanical, electrical, and plumbing equipment'),
  ('IT & Office', 'vendor', 'Information technology and office equipment'),
  ('Plant & Machinery', 'vendor', 'Heavy equipment, plant hire, and machinery'),
  ('Professional Services', 'vendor', 'Consultancy, legal, and professional services'),
  ('Logistics', 'vendor', 'Transport, freight, and warehousing'),
  ('General Building', 'contractor', 'General building and civil works'),
  ('Civil Engineering', 'contractor', 'Infrastructure and civil engineering'),
  ('Mechanical & Electrical', 'contractor', 'M&E specialist contractors'),
  ('Interior Fit-Out', 'contractor', 'Interior design and fit-out works'),
  ('Earthworks', 'contractor', 'Site clearing, earthworks, and piling'),
  ('Specialist Works', 'contractor', 'Specialist and trade contractors')
on conflict (name, kind) do nothing;

-- Seed document types
insert into public.crm_document_types (name, description, requires_expiry) values
  ('SSM Certificate', 'Companies Commission of Malaysia registration', true),
  ('CIDB Certificate', 'CIDB contractor registration certificate', true),
  ('Business License', 'Local authority business premise license', true),
  ('Tax Certificate', 'LHDN tax registration or clearance', true),
  ('Insurance', 'Public liability or works insurance', true),
  ('ISO Certificate', 'Quality / environmental / safety management certification', true),
  ('Bank Statement', 'Supporting financial document', false),
  ('Company Profile', 'Corporate profile pack', false),
  ('Audited Accounts', 'Latest audited financial statements', true),
  ('Work Permit', 'Work or operating permit', true),
  ('Safety Certificate', 'CIDB green card or safety certification', true),
  ('Other', 'Other supporting document', false)
on conflict (name) do nothing;

-- Seed settings
insert into public.crm_settings (key, value) values
  ('organization_name', '"UBBIM"'::jsonb),
  ('organization_legal_name', '"UBBIM Corporate CRM"'::jsonb),
  ('currency', '"MYR"'::jsonb),
  ('document_warning_days', '[90, 60, 30]'::jsonb),
  ('vendor_registration_fee', '150.00'::jsonb),
  ('contractor_registration_fee', '250.00'::jsonb),
  ('support_email', '"crm@ubbim.com"'::jsonb),
  ('timezone', '"Asia/Kuala_Lumpur"'::jsonb)
on conflict (key) do nothing;
