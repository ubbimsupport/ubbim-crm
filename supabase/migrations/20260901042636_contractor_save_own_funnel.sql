create or replace function public.crm_save_company_funnel(
  p_company_id uuid,
  p_stage public.crm_funnel_stage,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed boolean;
begin
  select exists (
    select 1
    from public.crm_profiles p
    where p.id = (select auth.uid())
      and p.is_active = true
      and (
        (select crm_private.can_write_company(p_company_id))
        or (
          p.role = 'contractor'
          and exists (
            select 1
            from public.crm_companies c
            where c.id = p_company_id
              and c.email is not null
              and lower(c.email) = lower(p.email)
          )
        )
      )
  ) into allowed;

  if not allowed then
    raise exception 'You cannot save this funnel.';
  end if;

  update public.crm_companies
  set funnel_stage = p_stage, updated_at = now()
  where id = p_company_id;

  insert into public.crm_funnel_events (company_id, stage, note, created_by)
  values (
    p_company_id,
    p_stage,
    coalesce(nullif(trim(both from coalesce(p_note, '')), ''), 'Funnel saved to CRM'),
    (select auth.uid())
  );
end;
$$;

revoke all on function public.crm_save_company_funnel(uuid, public.crm_funnel_stage, text) from public;
grant execute on function public.crm_save_company_funnel(uuid, public.crm_funnel_stage, text) to authenticated;
