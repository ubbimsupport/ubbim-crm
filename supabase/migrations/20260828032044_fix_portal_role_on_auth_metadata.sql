-- GoTrue often inserts auth.users first, then patches raw_app_meta_data.
-- Apply portal/staff roles when metadata arrives, and let service_role
-- (or table owners) update crm_profiles.role / is_active.

create or replace function crm_private.lock_privileged_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if current_user in ('postgres', 'supabase_admin') then
      return new;
    end if;
    if coalesce(auth.role(), '') = 'service_role' then
      return new;
    end if;
    if not crm_private.is_super_admin() then
      new.role := old.role;
      new.is_active := old.is_active;
    end if;
  end if;
  return new;
end;
$$;

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
  v_meta_role text;
  v_kind public.crm_company_kind;
begin
  v_meta_role := new.raw_app_meta_data->>'crm_role';

  if v_meta_role in ('super_admin', 'admin', 'staff', 'management', 'user', 'contractor') then
    v_role := v_meta_role::public.crm_user_role;
    v_active := true;
  else
    select c.company_kind into v_kind
    from public.crm_companies c
    where lower(c.email) = lower(new.email)
      and c.status = 'pending'
    order by c.created_at desc
    limit 1;

    if v_kind = 'contractor' then
      v_role := 'contractor';
      v_active := true;
    elsif v_kind = 'vendor' then
      v_role := 'user';
      v_active := true;
    elsif not exists (select 1 from public.crm_profiles) then
      v_role := 'super_admin';
      v_active := true;
    end if;
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
        full_name = excluded.full_name,
        role = excluded.role,
        is_active = excluded.is_active,
        updated_at = now()
    where new.raw_app_meta_data->>'crm_role' in (
      'super_admin', 'admin', 'staff', 'management', 'user', 'contractor'
    );

  return new;
end;
$$;

drop trigger if exists on_auth_user_metadata_updated on auth.users;
create trigger on_auth_user_metadata_updated
  after update of raw_app_meta_data on auth.users
  for each row
  when (new.raw_app_meta_data is distinct from old.raw_app_meta_data)
  execute function crm_private.handle_new_user();

-- Activate the registration account created before this trigger existed.
update public.crm_profiles p
set role = 'contractor',
    is_active = true,
    full_name = coalesce(p.full_name, 'Password Tester')
from auth.users u
where u.id = p.id
  and u.email = 'contractor.pass.828@ubbim.com';
