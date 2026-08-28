insert into public.crm_roles (name, display_name, description, permissions) values
  ('user', 'User', 'Portal access to the user dashboard only.', '{"portal": "user"}'::jsonb),
  ('contractor', 'Contractor', 'Portal access to the contractor dashboard only.', '{"portal": "contractor"}'::jsonb)
on conflict (name) do nothing;
