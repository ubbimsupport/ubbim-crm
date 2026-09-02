drop policy if exists crm_companies_delete on public.crm_companies;
create policy crm_companies_delete on public.crm_companies
  for delete to authenticated
  using ((select crm_private.is_admin_or_above()));

drop policy if exists crm_vendors_delete on public.crm_vendors;
create policy crm_vendors_delete on public.crm_vendors
  for delete to authenticated
  using ((select crm_private.is_admin_or_above()));

drop policy if exists crm_contractors_delete on public.crm_contractors;
create policy crm_contractors_delete on public.crm_contractors
  for delete to authenticated
  using ((select crm_private.is_admin_or_above()));

drop policy if exists crm_funnel_events_delete on public.crm_funnel_events;
create policy crm_funnel_events_delete on public.crm_funnel_events
  for delete to authenticated
  using ((select crm_private.is_admin_or_above()));
