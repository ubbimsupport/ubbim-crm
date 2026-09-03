-- Contractor portal schema, helpers, RLS, storage, and support tickets.
-- Applied on hosted Supabase as 20260903072343.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'crm_document_review_status') then
    create type public.crm_document_review_status as enum ('pending_review', 'approved', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'crm_support_ticket_status') then
    create type public.crm_support_ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
  end if;
  if not exists (select 1 from pg_type where typname = 'crm_support_ticket_priority') then
    create type public.crm_support_ticket_priority as enum ('low', 'medium', 'high', 'urgent');
  end if;
  if not exists (select 1 from pg_type where typname = 'crm_support_ticket_category') then
    create type public.crm_support_ticket_category as enum ('account', 'registration', 'documents', 'payment', 'project', 'technical_support', 'other');
  end if;
end $$;

alter table public.crm_profiles
  add column if not exists company_id uuid references public.crm_companies (id) on delete set null;

create index if not exists crm_profiles_company_id_idx on public.crm_profiles (company_id);

alter table public.crm_companies
  add column if not exists address_line2 text,
  add column if not exists rejection_reason text;

alter table public.crm_contractors
  add column if not exists cidb_category text,
  add column if not exists cidb_issue_date date;

alter table public.crm_documents
  add column if not exists review_status public.crm_document_review_status not null default 'pending_review',
  add column if not exists review_reason text,
  add column if not exists reviewed_by uuid references public.crm_profiles (id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create index if not exists crm_documents_review_status_idx on public.crm_documents (review_status);

create sequence if not exists public.crm_support_ticket_seq;

create table if not exists public.crm_contractor_support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default ('TKT-' || lpad(nextval('public.crm_support_ticket_seq')::text, 5, '0')),
  company_id uuid not null references public.crm_companies (id) on delete cascade,
  created_by uuid not null references public.crm_profiles (id) on delete restrict,
  assigned_to uuid references public.crm_profiles (id) on delete set null,
  subject text not null,
  category public.crm_support_ticket_category not null default 'other',
  priority public.crm_support_ticket_priority not null default 'medium',
  status public.crm_support_ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_support_tickets_company_id_idx on public.crm_contractor_support_tickets (company_id);
create index if not exists crm_support_tickets_status_idx on public.crm_contractor_support_tickets (status);
create index if not exists crm_support_tickets_created_by_idx on public.crm_contractor_support_tickets (created_by);

create table if not exists public.crm_contractor_support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.crm_contractor_support_tickets (id) on delete cascade,
  author_id uuid not null references public.crm_profiles (id) on delete restrict,
  body text not null,
  attachment_path text,
  attachment_name text,
  created_at timestamptz not null default now()
);

create index if not exists crm_support_messages_ticket_id_idx on public.crm_contractor_support_messages (ticket_id);

create table if not exists public.crm_contractor_notification_settings (
  user_id uuid primary key references public.crm_profiles (id) on delete cascade,
  email_notifications boolean not null default true,
  document_expiry_alerts boolean not null default true,
  payment_notifications boolean not null default true,
  project_notifications boolean not null default true,
  support_notifications boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.crm_document_types (name, description, requires_expiry, is_active)
values
  ('CIDB Certificate', 'CIDB registration certificate', true, true),
  ('SSM Certificate', 'SSM company registration certificate', true, true),
  ('Insurance', 'Insurance coverage document', true, true),
  ('License', 'Trade or operating license', true, true),
  ('Training Certificate', 'Staff or company training certificate', true, true),
  ('Company Certificate', 'Company certification', true, true),
  ('Other', 'Other supporting document', false, true)
on conflict (name) do update set is_active = true, description = excluded.description;

update public.crm_profiles p
set company_id = x.company_id
from (
  select distinct on (lower(c.email)) lower(c.email) as email_key, c.id as company_id
  from public.crm_companies c
  where c.email is not null
  order by lower(c.email), c.created_at desc
) x
where p.company_id is null
  and p.role in ('contractor', 'user')
  and lower(p.email) = x.email_key;

create or replace function crm_private.is_internal_user()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select crm_private.current_role() in ('super_admin', 'admin', 'staff', 'management');
$$;

create or replace function crm_private.own_company_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.company_id from public.crm_profiles p
  where p.id = (select auth.uid()) and p.is_active = true;
$$;

create or replace function crm_private.can_write_own_company(p_company_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.crm_profiles p
    where p.id = (select auth.uid())
      and p.is_active = true
      and p.role in ('contractor', 'user')
      and p.company_id is not null
      and p.company_id = p_company_id
  );
$$;

create or replace function crm_private.can_access_company(p_company_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.crm_profiles p
    where p.id = (select auth.uid())
      and p.is_active = true
      and (
        p.role in ('super_admin', 'admin', 'management')
        or exists (select 1 from public.crm_company_assignments a where a.company_id = p_company_id and a.user_id = p.id)
        or exists (select 1 from public.crm_companies c where c.id = p_company_id and c.pic_id = p.id)
        or (p.role in ('user', 'contractor') and p.company_id is not null and p.company_id = p_company_id)
        or (
          p.role in ('user', 'contractor') and p.company_id is null
          and exists (
            select 1 from public.crm_companies c
            where c.id = p_company_id and c.email is not null and lower(c.email) = lower(p.email)
          )
        )
      )
  );
$$;

create or replace function crm_private.lock_privileged_profile_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if current_user in ('postgres', 'supabase_admin') then return new; end if;
    if coalesce(auth.role(), '') = 'service_role' then return new; end if;
    if not crm_private.is_super_admin() then
      new.role := old.role;
      new.is_active := old.is_active;
      if old.company_id is not null then new.company_id := old.company_id; end if;
    end if;
  end if;
  return new;
end;
$$;

create or replace function crm_private.protect_company_internal_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if crm_private.can_write_own_company(old.id) and not crm_private.is_internal_user() then
    new.company_code := old.company_code;
    new.company_kind := old.company_kind;
    new.status := old.status;
    new.rating := old.rating;
    new.remarks := old.remarks;
    new.rejection_reason := old.rejection_reason;
    new.pic_id := old.pic_id;
    new.created_by := old.created_by;
    new.registration_date := old.registration_date;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_company_internal_fields on public.crm_companies;
create trigger trg_protect_company_internal_fields
  before update on public.crm_companies
  for each row execute function crm_private.protect_company_internal_fields();

create or replace function crm_private.protect_contractor_internal_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if crm_private.can_write_own_company(old.company_id) and not crm_private.is_internal_user() then
    new.contractor_code := old.contractor_code;
    new.company_id := old.company_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_contractor_internal_fields on public.crm_contractors;
create trigger trg_protect_contractor_internal_fields
  before update on public.crm_contractors
  for each row execute function crm_private.protect_contractor_internal_fields();

create or replace function crm_private.protect_document_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if crm_private.can_write_own_company(new.company_id) and not crm_private.is_internal_user() then
      new.review_status := 'pending_review';
      new.review_reason := null;
      new.reviewed_by := null;
      new.reviewed_at := null;
    end if;
    return new;
  end if;
  if crm_private.can_write_own_company(old.company_id) and not crm_private.is_internal_user() then
    if new.file_path is distinct from old.file_path
       or new.document_name is distinct from old.document_name
       or new.expiry_date is distinct from old.expiry_date then
      new.review_status := 'pending_review';
      new.review_reason := null;
      new.reviewed_by := null;
      new.reviewed_at := null;
    else
      new.review_status := old.review_status;
      new.review_reason := old.review_reason;
      new.reviewed_by := old.reviewed_by;
      new.reviewed_at := old.reviewed_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_document_review on public.crm_documents;
create trigger trg_protect_document_review
  before insert or update on public.crm_documents
  for each row execute function crm_private.protect_document_review();

create or replace function crm_private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_role public.crm_user_role := 'staff';
  v_active boolean := false;
  v_name text;
  v_meta_role text;
  v_kind public.crm_company_kind;
  v_company_id uuid;
begin
  v_meta_role := new.raw_app_meta_data->>'crm_role';
  select c.id, c.company_kind into v_company_id, v_kind
  from public.crm_companies c
  where c.email is not null and lower(c.email) = lower(new.email)
  order by c.created_at desc limit 1;

  if v_meta_role in ('super_admin', 'admin', 'staff', 'management', 'user', 'contractor') then
    v_role := v_meta_role::public.crm_user_role;
    v_active := true;
  else
    if v_kind = 'contractor' then v_role := 'contractor'; v_active := true;
    elsif v_kind = 'vendor' then v_role := 'user'; v_active := true;
    elsif not exists (select 1 from public.crm_profiles) then v_role := 'super_admin'; v_active := true;
    end if;
  end if;

  v_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'User');

  insert into public.crm_profiles (id, full_name, email, role, is_active, company_id)
  values (new.id, v_name, new.email, v_role, v_active, v_company_id)
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        is_active = excluded.is_active,
        company_id = coalesce(public.crm_profiles.company_id, excluded.company_id),
        updated_at = now()
    where new.raw_app_meta_data->>'crm_role' in (
      'super_admin', 'admin', 'staff', 'management', 'user', 'contractor'
    );
  return new;
end;
$$;

create or replace function crm_private.set_ticket_updated_at()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_support_ticket_updated_at on public.crm_contractor_support_tickets;
create trigger trg_support_ticket_updated_at
  before update on public.crm_contractor_support_tickets
  for each row execute function crm_private.set_ticket_updated_at();

drop trigger if exists trg_notification_settings_updated_at on public.crm_contractor_notification_settings;
create trigger trg_notification_settings_updated_at
  before update on public.crm_contractor_notification_settings
  for each row execute function crm_private.set_updated_at();

alter table public.crm_contractor_support_tickets enable row level security;
alter table public.crm_contractor_support_messages enable row level security;
alter table public.crm_contractor_notification_settings enable row level security;

grant select, insert, update, delete on public.crm_contractor_support_tickets to authenticated;
grant select, insert on public.crm_contractor_support_messages to authenticated;
grant select, insert, update on public.crm_contractor_notification_settings to authenticated;
grant usage, select on sequence public.crm_support_ticket_seq to authenticated;

drop policy if exists crm_profiles_select on public.crm_profiles;
create policy crm_profiles_select on public.crm_profiles
  for select using (
    id = (select auth.uid())
    or crm_private.is_internal_user()
    or (crm_private.current_role() in ('user', 'contractor') and role in ('super_admin', 'admin', 'staff', 'management'))
  );

drop policy if exists crm_companies_update on public.crm_companies;
create policy crm_companies_update on public.crm_companies
  for update using (crm_private.can_write_company(id) or crm_private.can_write_own_company(id))
  with check (crm_private.can_write_company(id) or crm_private.can_write_own_company(id));

drop policy if exists crm_contractors_update on public.crm_contractors;
create policy crm_contractors_update on public.crm_contractors
  for update using (crm_private.can_write_company(company_id) or crm_private.can_write_own_company(company_id))
  with check (crm_private.can_write_company(company_id) or crm_private.can_write_own_company(company_id));

drop policy if exists crm_contacts_insert on public.crm_contacts;
create policy crm_contacts_insert on public.crm_contacts
  for insert with check (crm_private.can_write_company(company_id) or crm_private.can_write_own_company(company_id));

drop policy if exists crm_contacts_update on public.crm_contacts;
create policy crm_contacts_update on public.crm_contacts
  for update using (crm_private.can_write_company(company_id) or crm_private.can_write_own_company(company_id))
  with check (crm_private.can_write_company(company_id) or crm_private.can_write_own_company(company_id));

drop policy if exists crm_documents_insert on public.crm_documents;
create policy crm_documents_insert on public.crm_documents
  for insert with check (crm_private.can_write_company(company_id) or crm_private.can_write_own_company(company_id));

drop policy if exists crm_documents_update on public.crm_documents;
create policy crm_documents_update on public.crm_documents
  for update using (crm_private.can_write_company(company_id) or crm_private.can_write_own_company(company_id))
  with check (crm_private.can_write_company(company_id) or crm_private.can_write_own_company(company_id));

drop policy if exists crm_notes_select on public.crm_notes;
create policy crm_notes_select on public.crm_notes
  for select using (crm_private.is_internal_user());

drop policy if exists crm_activities_insert on public.crm_activities;
create policy crm_activities_insert on public.crm_activities
  for insert with check (
    crm_private.is_admin_or_above()
    or (company_id is not null and crm_private.can_write_company(company_id))
    or (company_id is not null and crm_private.can_write_own_company(company_id) and user_id = (select auth.uid()))
  );

drop policy if exists crm_activities_update on public.crm_activities;
create policy crm_activities_update on public.crm_activities
  for update using (crm_private.is_admin_or_above() or (user_id = (select auth.uid()) and crm_private.is_internal_user()))
  with check (crm_private.is_admin_or_above() or (user_id = (select auth.uid()) and crm_private.is_internal_user()));

drop policy if exists crm_payments_insert on public.crm_payments;
create policy crm_payments_insert on public.crm_payments
  for insert with check (
    crm_private.is_admin_or_above()
    or (user_id = (select auth.uid()) and (company_id is null or crm_private.can_access_company(company_id)))
  );

drop policy if exists crm_notifications_delete on public.crm_notifications;
create policy crm_notifications_delete on public.crm_notifications
  for delete using (user_id = (select auth.uid()));

drop policy if exists crm_storage_insert on storage.objects;
create policy crm_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'crm-documents'
    and (crm_private.can_write_company(crm_private.storage_company_id(name))
      or crm_private.can_write_own_company(crm_private.storage_company_id(name)))
  );

drop policy if exists crm_storage_update on storage.objects;
create policy crm_storage_update on storage.objects
  for update using (
    bucket_id = 'crm-documents'
    and (crm_private.can_write_company(crm_private.storage_company_id(name))
      or crm_private.can_write_own_company(crm_private.storage_company_id(name)))
  )
  with check (
    bucket_id = 'crm-documents'
    and (crm_private.can_write_company(crm_private.storage_company_id(name))
      or crm_private.can_write_own_company(crm_private.storage_company_id(name)))
  );

drop policy if exists crm_storage_delete on storage.objects;
create policy crm_storage_delete on storage.objects
  for delete using (
    bucket_id = 'crm-documents'
    and (crm_private.is_admin_or_above() or crm_private.can_write_own_company(crm_private.storage_company_id(name)))
  );

drop policy if exists crm_support_tickets_select on public.crm_contractor_support_tickets;
create policy crm_support_tickets_select on public.crm_contractor_support_tickets
  for select using (crm_private.is_internal_user() or crm_private.can_access_company(company_id));

drop policy if exists crm_support_tickets_insert on public.crm_contractor_support_tickets;
create policy crm_support_tickets_insert on public.crm_contractor_support_tickets
  for insert with check (created_by = (select auth.uid()) and crm_private.can_write_own_company(company_id));

drop policy if exists crm_support_tickets_update on public.crm_contractor_support_tickets;
create policy crm_support_tickets_update on public.crm_contractor_support_tickets
  for update using (crm_private.is_internal_user() or crm_private.can_write_own_company(company_id))
  with check (crm_private.is_internal_user() or crm_private.can_write_own_company(company_id));

drop policy if exists crm_support_messages_select on public.crm_contractor_support_messages;
create policy crm_support_messages_select on public.crm_contractor_support_messages
  for select using (
    exists (
      select 1 from public.crm_contractor_support_tickets t
      where t.id = ticket_id and (crm_private.is_internal_user() or crm_private.can_access_company(t.company_id))
    )
  );

drop policy if exists crm_support_messages_insert on public.crm_contractor_support_messages;
create policy crm_support_messages_insert on public.crm_contractor_support_messages
  for insert with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.crm_contractor_support_tickets t
      where t.id = ticket_id and (crm_private.is_internal_user() or crm_private.can_write_own_company(t.company_id))
    )
  );

drop policy if exists crm_notification_settings_select on public.crm_contractor_notification_settings;
create policy crm_notification_settings_select on public.crm_contractor_notification_settings
  for select using (user_id = (select auth.uid()) or crm_private.is_internal_user());

drop policy if exists crm_notification_settings_insert on public.crm_contractor_notification_settings;
create policy crm_notification_settings_insert on public.crm_contractor_notification_settings
  for insert with check (user_id = (select auth.uid()));

drop policy if exists crm_notification_settings_update on public.crm_contractor_notification_settings;
create policy crm_notification_settings_update on public.crm_contractor_notification_settings
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
