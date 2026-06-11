-- Multi-tenancy: labels as accounts, the 'label' role, and artist<->label links.
-- Run this in the Supabase SQL editor.

-- 1. Allow the 'label' role on profiles
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin', 'label', 'artist'));

-- 2. Labels are accounts that own/manage a roster of artists
create table if not exists labels (
  id                uuid primary key default uuid_generate_v4(),
  owner_profile_id  uuid not null references profiles(id) on delete cascade,
  name              text not null default '',
  created_at        timestamptz not null default now()
);
alter table labels enable row level security;

-- 3. Artists optionally belong to a label
alter table artists add column if not exists label_id uuid references labels(id) on delete set null;

-- 4. Invites target a specific label (null = invited by platform admin / independent)
alter table artist_invites add column if not exists label_id uuid references labels(id) on delete cascade;
