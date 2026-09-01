create type public.crm_funnel_stage as enum (
  'inquiry',
  'registered',
  'documents',
  'payment',
  'review',
  'approved',
  'onboarded',
  'lost'
);

alter table public.crm_companies
  add column if not exists funnel_stage public.crm_funnel_stage not null default 'inquiry';

create index if not exists crm_companies_funnel_stage_idx
  on public.crm_companies (funnel_stage);

update public.crm_companies
set funnel_stage = case
  when status = 'active' then 'approved'::public.crm_funnel_stage
  when status in ('rejected', 'inactive', 'expired') then 'lost'::public.crm_funnel_stage
  when status = 'pending' then 'registered'::public.crm_funnel_stage
  else 'inquiry'::public.crm_funnel_stage
end
where funnel_stage = 'inquiry';

create table if not exists public.crm_funnel_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.crm_companies (id) on delete cascade,
  stage public.crm_funnel_stage not null,
  note text,
  created_by uuid references public.crm_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists crm_funnel_events_company_id_idx
  on public.crm_funnel_events (company_id, created_at desc);

insert into public.crm_funnel_events (company_id, stage, note)
select c.id, c.funnel_stage, 'Initial funnel saved to CRM'
from public.crm_companies c
where not exists (
  select 1 from public.crm_funnel_events e where e.company_id = c.id
);

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
        or (
          p.role in ('user', 'contractor')
          and exists (
            select 1
            from public.crm_companies c
            where c.id = p_company_id
              and c.email is not null
              and lower(c.email) = lower(p.email)
          )
        )
      )
  );
$$;

create or replace function crm_private.set_registered_funnel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending' and new.funnel_stage = 'inquiry' then
    new.funnel_stage := 'registered';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_registered_funnel on public.crm_companies;
create trigger trg_set_registered_funnel
  before insert on public.crm_companies
  for each row execute function crm_private.set_registered_funnel();

create or replace function crm_private.log_company_funnel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.crm_funnel_events (company_id, stage, note)
  values (new.id, new.funnel_stage, 'Funnel saved to CRM');
  return new;
end;
$$;

drop trigger if exists trg_log_company_funnel on public.crm_companies;
create trigger trg_log_company_funnel
  after insert on public.crm_companies
  for each row execute function crm_private.log_company_funnel();

alter table public.crm_funnel_events enable row level security;

create policy crm_funnel_events_select on public.crm_funnel_events
  for select to authenticated
  using ((select crm_private.can_access_company(company_id)));

create policy crm_funnel_events_insert on public.crm_funnel_events
  for insert to authenticated
  with check ((select crm_private.can_write_company(company_id)));

create policy crm_funnel_events_delete on public.crm_funnel_events
  for delete to authenticated
  using ((select crm_private.is_super_admin()));

grant select, insert on public.crm_funnel_events to authenticated;
grant all on public.crm_funnel_events to service_role;
