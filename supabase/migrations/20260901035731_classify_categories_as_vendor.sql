-- Merge contractor categories into Vendor.
update public.crm_categories
set kind = 'vendor',
    updated_at = now()
where kind = 'contractor';
