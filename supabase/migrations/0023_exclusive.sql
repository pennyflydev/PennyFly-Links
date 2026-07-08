-- Follow-to-unlock: gate exclusive content behind a Spotify connect.
-- The reward URL is never exposed publicly — revealed only after unlocking.
-- Run this in the Supabase SQL editor.

create table if not exists exclusive_content (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  title       text not null,
  description text default '',
  reward_url  text not null,
  cover_url   text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- RLS on, no public read policy: only the service role sees reward_url.
alter table exclusive_content enable row level security;
