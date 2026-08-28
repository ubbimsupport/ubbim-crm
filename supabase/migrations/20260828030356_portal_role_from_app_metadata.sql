-- Assign crm_profiles.role on signup:
-- 1) Auth Admin app_metadata.crm_role (staff-created users)
-- 2) Matching pending company registration email (public vendor/contractor signup)
-- 3) First Auth user becomes super_admin
-- 4) Otherwise staff + inactive

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
        updated_at = now();

  return new;
end;
$$;
