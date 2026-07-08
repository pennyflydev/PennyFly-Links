-- Superfan CRM: tag standout fans in the subscriber list.
-- Run this in the Supabase SQL editor.

alter table subscribers add column if not exists is_superfan boolean not null default false;
