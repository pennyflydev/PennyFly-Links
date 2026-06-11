-- Track whether a new signup has chosen their account type (artist vs label).
-- Run this in the Supabase SQL editor.

alter table profiles add column if not exists onboarded boolean not null default false;

-- Existing accounts shouldn't be forced through onboarding.
update profiles set onboarded = true;
