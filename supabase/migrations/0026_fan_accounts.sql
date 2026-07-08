-- Fan accounts: the two-sided network layer. Fans get their own login
-- (profiles.role = 'fan', no artist page) and can follow artists.
-- Run this in the Supabase SQL editor.

-- Allow 'fan' as a profile role.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin', 'label', 'artist', 'fan'));

-- A fan following an artist.
create table if not exists fan_follows (
  id              uuid primary key default gen_random_uuid(),
  fan_profile_id  uuid not null references profiles(id) on delete cascade,
  artist_id       uuid not null references artists(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (fan_profile_id, artist_id)
);
alter table fan_follows enable row level security;
-- No public read policy: follows are read via the admin client, scoped by app code.

-- Public follower count on the artist page.
create index if not exists fan_follows_artist_idx on fan_follows (artist_id);
