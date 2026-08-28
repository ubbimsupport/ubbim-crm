-- Add portal roles. Enum values must be committed before they can be used in DML.
alter type public.crm_user_role add value if not exists 'user';
alter type public.crm_user_role add value if not exists 'contractor';
