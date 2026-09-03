-- Extend existing enums for contractor portal notifications and activity timeline.
-- New values cannot be used until this migration commits.
alter type public.crm_notification_type add value if not exists 'document_uploaded';
alter type public.crm_notification_type add value if not exists 'document_approved';
alter type public.crm_notification_type add value if not exists 'document_rejected';
alter type public.crm_notification_type add value if not exists 'support_ticket';
alter type public.crm_notification_type add value if not exists 'support_reply';
alter type public.crm_notification_type add value if not exists 'payment_reminder';
alter type public.crm_notification_type add value if not exists 'profile_update';

alter type public.crm_activity_type add value if not exists 'profile_update';
alter type public.crm_activity_type add value if not exists 'document_uploaded';
alter type public.crm_activity_type add value if not exists 'payment_completed';
alter type public.crm_activity_type add value if not exists 'support_ticket';
alter type public.crm_activity_type add value if not exists 'project_assigned';
