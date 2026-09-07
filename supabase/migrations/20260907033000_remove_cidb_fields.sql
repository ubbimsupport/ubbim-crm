-- Remove CIDB-only contractor columns and registration parameters.
-- Existing CRM companies, contractors, vendors, contacts, documents, and projects are preserved.

drop index if exists public.crm_contractors_cidb_expiry_idx;

alter table public.crm_contractors
  drop column if exists cidb_grade,
  drop column if exists cidb_registration_number,
  drop column if exists cidb_expiry_date,
  drop column if exists cidb_category,
  drop column if exists cidb_issue_date;

drop function if exists public.crm_submit_company_registration(
  public.crm_company_kind,
  text,
  text,
  text,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  text
);

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
    insert into public.crm_contractors (company_id, specialization)
    values (v_company_id, p_specialization);
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
  public.crm_company_kind, text, text, text, uuid, text, text, text, text, text, text
) to anon, authenticated, service_role;

update public.crm_document_types
set is_active = false
where name = 'CIDB Certificate';

update public.crm_document_types
set description = 'Safety certification'
where name = 'Safety Certificate'
  and description ilike '%CIDB%';
