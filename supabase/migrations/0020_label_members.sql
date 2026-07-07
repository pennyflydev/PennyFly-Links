-- Label team members: invite managers to help run a label.
-- Run this in the Supabase SQL editor.

create table if not exists label_members (
  id          uuid primary key default gen_random_uuid(),
  label_id    uuid not null references labels(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  member_role text not null default 'manager' check (member_role in ('manager', 'viewer')),
  created_at  timestamptz not null default now(),
  unique (label_id, profile_id)
);
alter table label_members enable row level security;

create table if not exists label_member_invites (
  id          uuid primary key default gen_random_uuid(),
  label_id    uuid not null references labels(id) on delete cascade,
  email       text not null,
  member_role text not null default 'manager' check (member_role in ('manager', 'viewer')),
  claimed_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '14 days')
);
alter table label_member_invites enable row level security;
