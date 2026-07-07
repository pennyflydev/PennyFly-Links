-- Label branding: labels can white-label their roster's pages.
-- Run this in the Supabase SQL editor.

alter table labels add column if not exists logo_url     text;
alter table labels add column if not exists accent_color text;
