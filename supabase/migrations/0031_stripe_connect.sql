-- Stripe Connect (Express): let artists get paid directly by fans. Money goes
-- to the artist's own connected account; FlyLink takes an application fee.
-- Run this in the Supabase SQL editor.

alter table artists add column if not exists stripe_account_id      text;
alter table artists add column if not exists stripe_charges_enabled boolean not null default false;
