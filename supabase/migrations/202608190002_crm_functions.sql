-- UBBIM Corporate CRM — functions, triggers, RPCs

-- ---------------------------------------------------------------------------
-- Timestamp helper
-- ---------------------------------------------------------------------------

create or replace function crm_private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Role / access helpers (private, security definer)
-- ---------------------------------------------------------------------------

create or replace function crm_private.current_role()
returns public.crm_user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.crm_profiles p
  where p.id = (select auth.uid())
    and p.is_active = true
$$;

create or replace function crm_private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.crm_profiles p
    where p.id = (select auth.uid())
      and p.is_active = true
  );
$$;

create or replace function crm_private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select crm_private.current_role() = 'super_admin';
$$;

create or replace function crm_private.is_admin_or_above()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select crm_private.current_role() in ('super_admin', 'admin');
$$;

create or replace function crm_private.is_management()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select crm_private.current_role() = 'management';
$$;

create or replace function crm_private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select crm_private.current_role() = 'staff';
$$;

create or replace function crm_private.can_access_company(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.crm_profiles p
    where p.id = (select auth.uid())
      and p.is_active = true
      and (
        p.role in ('super_admin', 'admin', 'management')
        or exists (
          select 1
          from public.crm_company_assignments a
          where a.company_id = p_company_id
            and a.user_id = p.id
        )
        or exists (
          select 1
          from public.crm_companies c
          where c.id = p_company_id
            and c.pic_id = p.id
        )
      )
  );
$$;

create or replace function crm_private.lock_privileged_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and not crm_private.is_super_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;

create or replace function crm_private.can_write_company(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.crm_profiles p
    where p.id = (select auth.uid())
      and p.is_active = true
      and (
        p.role in ('super_admin', 'admin')
        or (
          p.role = 'staff'
          and (
            exists (
              select 1
              from public.crm_company_assignments a
              where a.company_id = p_company_id
                and a.user_id = p.id
            )
            or exists (
              select 1
              from public.crm_companies c
              where c.id = p_company_id
                and c.pic_id = p.id
            )
          )
        )
      )
  );
$$;

grant execute on function crm_private.current_role() to authenticated, service_role;
grant execute on function crm_private.is_active_user() to authenticated, service_role;
grant execute on function crm_private.is_super_admin() to authenticated, service_role;
grant execute on function crm_private.is_admin_or_above() to authenticated, service_role;
grant execute on function crm_private.is_management() to authenticated, service_role;
grant execute on function crm_private.is_staff() to authenticated, service_role;
grant execute on function crm_private.can_access_company(uuid) to authenticated, service_role;
grant execute on function crm_private.can_write_company(uuid) to authenticated, service_role;

-- Public wrappers for the app (do not expose privileged data)
create or replace function public.crm_current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select crm_private.current_role()::text;
$$;

revoke all on function public.crm_current_role() from public, anon;
grant execute on function public.crm_current_role() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Human-readable codes
-- ---------------------------------------------------------------------------

create or replace function crm_private.assign_company_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.company_code is null or btrim(new.company_code) = '' then
    if new.company_kind = 'vendor' then
      new.company_code := 'VND-' || lpad(nextval('public.crm_vendor_seq')::text, 5, '0');
    else
      new.company_code := 'CTR-' || lpad(nextval('public.crm_contractor_seq')::text, 5, '0');
    end if;
  end if;
  return new;
end;
$$;

create or replace function crm_private.assign_vendor_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  select c.company_code into v_code
  from public.crm_companies c
  where c.id = new.company_id;

  if new.vendor_code is null or btrim(new.vendor_code) = '' then
    new.vendor_code := coalesce(v_code, 'VND-' || lpad(nextval('public.crm_vendor_seq')::text, 5, '0'));
  end if;
  return new;
end;
$$;

create or replace function crm_private.assign_contractor_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  select c.company_code into v_code
  from public.crm_companies c
  where c.id = new.company_id;

  if new.contractor_code is null or btrim(new.contractor_code) = '' then
    new.contractor_code := coalesce(v_code, 'CTR-' || lpad(nextval('public.crm_contractor_seq')::text, 5, '0'));
  end if;
  return new;
end;
$$;

create or replace function crm_private.assign_project_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.project_code is null or btrim(new.project_code) = '' then
    new.project_code := 'PRJ-' || lpad(nextval('public.crm_project_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

create or replace function crm_private.assign_document_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.document_code is null or btrim(new.document_code) = '' then
    new.document_code := 'DOC-' || lpad(nextval('public.crm_document_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

create or replace function crm_private.assign_invoice_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.invoice_code is null or btrim(new.invoice_code) = '' then
    new.invoice_code := 'INV-' || lpad(nextval('public.crm_invoice_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

create or replace function crm_private.assign_payment_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.payment_code is null or btrim(new.payment_code) = '' then
    new.payment_code := 'PAY-' || lpad(nextval('public.crm_payment_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

create or replace function crm_private.assign_activity_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.activity_code is null or btrim(new.activity_code) = '' then
    new.activity_code := 'ACT-' || lpad(nextval('public.crm_activity_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Document expiry status
-- ---------------------------------------------------------------------------

create or replace function crm_private.document_status_for(p_expiry date)
returns public.crm_document_status
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  warn_days integer := 90;
  setting jsonb;
begin
  select s.value into setting
  from public.crm_settings s
  where s.key = 'document_warning_days';

  if setting is not null then
    warn_days := coalesce((setting->>0)::integer, 90);
  end if;

  if p_expiry is null then
    return 'active';
  elsif p_expiry < current_date then
    return 'expired';
  elsif p_expiry <= current_date + warn_days then
    return 'expiring_soon';
  else
    return 'active';
  end if;
end;
$$;

create or replace function crm_private.set_document_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.status := crm_private.document_status_for(new.expiry_date);
  return new;
end;
$$;

create or replace function public.crm_refresh_document_statuses()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_count integer;
begin
  update public.crm_documents d
  set status = crm_private.document_status_for(d.expiry_date),
      updated_at = now()
  where d.status is distinct from crm_private.document_status_for(d.expiry_date);

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.crm_refresh_document_statuses() from public, anon;
grant execute on function public.crm_refresh_document_statuses() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Audit trigger
-- ---------------------------------------------------------------------------

create or replace function crm_private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
  v_record uuid;
  v_old jsonb;
  v_new jsonb;
begin
  if tg_op = 'INSERT' then
    v_action := 'created';
    v_new := to_jsonb(new);
    v_record := (to_jsonb(new)->>'id')::uuid;
  elsif tg_op = 'UPDATE' then
    v_action := 'updated';
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_record := (to_jsonb(new)->>'id')::uuid;
  else
    v_action := 'deleted';
    v_old := to_jsonb(old);
    v_record := (to_jsonb(old)->>'id')::uuid;
  end if;

  insert into public.crm_audit_logs (user_id, action, module, record_id, old_value, new_value)
  values (
    (select auth.uid()),
    v_action,
    tg_table_name,
    v_record,
    v_old,
    v_new
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Sync project companies
-- ---------------------------------------------------------------------------

create or replace function crm_private.sync_project_companies()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.crm_project_companies
  where project_id = new.id
    and role in ('vendor', 'contractor');

  if new.vendor_id is not null then
    insert into public.crm_project_companies (project_id, company_id, role)
    values (new.id, new.vendor_id, 'vendor')
    on conflict (project_id, company_id) do update set role = excluded.role;
  end if;

  if new.contractor_id is not null then
    insert into public.crm_project_companies (project_id, company_id, role)
    values (new.id, new.contractor_id, 'contractor')
    on conflict (project_id, company_id) do update set role = excluded.role;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- New auth user → profile
-- ---------------------------------------------------------------------------

create or replace function crm_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.crm_user_role := 'staff';
  v_active boolean := false;
  v_name text;
begin
  if not exists (select 1 from public.crm_profiles) then
    v_role := 'super_admin';
    v_active := true;
  end if;

  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'User'
  );

  insert into public.crm_profiles (id, full_name, email, role, is_active)
  values (new.id, v_name, new.email, v_role, v_active)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function crm_private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Attach updated_at / code / audit triggers
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'crm_roles', 'crm_profiles', 'crm_categories', 'crm_companies', 'crm_vendors',
    'crm_contractors', 'crm_contacts', 'crm_document_types', 'crm_documents',
    'crm_projects', 'crm_activities', 'crm_notes', 'crm_invoices', 'crm_payments',
    'crm_subscriptions'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; create trigger set_updated_at before update on public.%I for each row execute function crm_private.set_updated_at();',
      t, t
    );
  end loop;
end;
$$;

create trigger trg_lock_profile_fields before update on public.crm_profiles
  for each row execute function crm_private.lock_privileged_profile_fields();

create trigger trg_company_code before insert on public.crm_companies
  for each row execute function crm_private.assign_company_code();

create trigger trg_vendor_code before insert on public.crm_vendors
  for each row execute function crm_private.assign_vendor_code();

create trigger trg_contractor_code before insert on public.crm_contractors
  for each row execute function crm_private.assign_contractor_code();

create trigger trg_project_code before insert on public.crm_projects
  for each row execute function crm_private.assign_project_code();

create trigger trg_document_code before insert on public.crm_documents
  for each row execute function crm_private.assign_document_code();

create trigger trg_invoice_code before insert on public.crm_invoices
  for each row execute function crm_private.assign_invoice_code();

create trigger trg_payment_code before insert on public.crm_payments
  for each row execute function crm_private.assign_payment_code();

create trigger trg_activity_code before insert on public.crm_activities
  for each row execute function crm_private.assign_activity_code();

create trigger trg_document_status before insert or update of expiry_date on public.crm_documents
  for each row execute function crm_private.set_document_status();

create trigger trg_sync_project_companies after insert or update of vendor_id, contractor_id on public.crm_projects
  for each row execute function crm_private.sync_project_companies();

do $$
declare
  t text;
begin
  foreach t in array array[
    'crm_companies', 'crm_vendors', 'crm_contractors', 'crm_contacts',
    'crm_documents', 'crm_projects', 'crm_activities', 'crm_payments',
    'crm_invoices', 'crm_profiles'
  ]
  loop
    execute format(
      'drop trigger if exists trg_audit on public.%I; create trigger trg_audit after insert or update or delete on public.%I for each row execute function crm_private.audit_row_change();',
      t, t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public registration RPC (anon + authenticated)
-- ---------------------------------------------------------------------------

create or replace function public.crm_submit_company_registration(
  p_kind public.crm_company_kind,
  p_company_name text,
  p_registration_number text,
  p_company_type text,
  p_category_id uuid,
  p_contact_person text,
  p_email text,
  p_phone text,
  p_address text,
  p_state text,
  p_cidb_grade text default null,
  p_cidb_registration_number text default null,
  p_cidb_expiry_date date default null,
  p_specialization text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
begin
  if p_company_name is null or btrim(p_company_name) = '' then
    raise exception 'Company name is required';
  end if;
  if p_email is null or btrim(p_email) = '' then
    raise exception 'Email is required';
  end if;

  insert into public.crm_companies (
    company_name, registration_number, company_kind, company_type, category_id,
    contact_person, email, phone, address, state, status, registration_date
  ) values (
    p_company_name, p_registration_number, p_kind, p_company_type, p_category_id,
    p_contact_person, p_email, p_phone, p_address, p_state, 'pending', current_date
  )
  returning id into v_company_id;

  if p_kind = 'vendor' then
    insert into public.crm_vendors (company_id, specialization)
    values (v_company_id, p_specialization);
  else
    insert into public.crm_contractors (
      company_id, cidb_grade, cidb_registration_number, cidb_expiry_date, specialization
    ) values (
      v_company_id, p_cidb_grade, p_cidb_registration_number, p_cidb_expiry_date, p_specialization
    );
  end if;

  insert into public.crm_notifications (user_id, type, title, body, link, entity_type, entity_id)
  select p.id,
         'new_registration',
         'New ' || p_kind::text || ' registration',
         p_company_name || ' submitted a registration request.',
         '/' || p_kind::text || 's/' || v_company_id::text,
         'company',
         v_company_id
  from public.crm_profiles p
  where p.role in ('super_admin', 'admin')
    and p.is_active = true;

  return v_company_id;
end;
$$;

grant execute on function public.crm_submit_company_registration(
  public.crm_company_kind, text, text, text, uuid, text, text, text, text, text, text, text, date, text
) to anon, authenticated, service_role;

-- Stripe webhook helper (service role)
create or replace function public.crm_apply_payment_status(
  p_payment_id uuid,
  p_status public.crm_payment_status,
  p_stripe_payment_intent_id text default null,
  p_receipt_url text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.crm_payments
  set status = p_status,
      stripe_payment_intent_id = coalesce(p_stripe_payment_intent_id, stripe_payment_intent_id),
      receipt_url = coalesce(p_receipt_url, receipt_url),
      paid_at = case when p_status = 'paid' then coalesce(paid_at, now()) else paid_at end,
      updated_at = now()
  where id = p_payment_id;

  if p_status = 'paid' then
    update public.crm_invoices i
    set status = 'paid',
        paid_at = now()
    from public.crm_payments p
    where p.id = p_payment_id
      and i.id = p.invoice_id;
  end if;
end;
$$;

revoke all on function public.crm_apply_payment_status(uuid, public.crm_payment_status, text, text) from public, anon, authenticated;
grant execute on function public.crm_apply_payment_status(uuid, public.crm_payment_status, text, text) to service_role;
