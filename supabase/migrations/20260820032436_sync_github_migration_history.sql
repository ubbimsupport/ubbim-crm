-- Already applied on the hosted UBBIM CRM project.
-- Kept so GitHub / CLI migration history matches the remote database.
insert into supabase_migrations.schema_migrations (version, name, statements, created_by)
values
  ('202608190001', 'crm_schema', ARRAY[]::text[], 'github-sync'),
  ('202608190002', 'crm_functions', ARRAY[]::text[], 'github-sync'),
  ('202608190003', 'crm_rls', ARRAY[]::text[], 'github-sync'),
  ('202608190004', 'crm_storage_seed', ARRAY[]::text[], 'github-sync')
on conflict (version) do nothing;
