-- Link scheduling: FlyLinks can go live / expire at a set time.
-- Run this in the Supabase SQL editor.

alter table promo_links add column if not exists publish_at timestamptz;
alter table promo_links add column if not exists expires_at timestamptz;
