-- Referral program: each account gets a code; track who they bring in.
-- Run this in the Supabase SQL editor.

alter table profiles add column if not exists referral_code text unique;

create table if not exists referrals (
  id                  uuid primary key default gen_random_uuid(),
  referrer_profile_id uuid not null references profiles(id) on delete cascade,
  referred_profile_id uuid unique references profiles(id) on delete cascade,
  referred_email      text,
  status              text not null default 'signed_up',
  created_at          timestamptz not null default now()
);

alter table referrals enable row level security;
