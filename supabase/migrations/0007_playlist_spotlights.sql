-- Playlist Spotlight: curated Spotify playlist deep-links on the artist page.
-- Run this in the Supabase SQL editor.

create table if not exists playlist_spotlights (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  title       text not null default '',
  spotify_url text not null,
  cover_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table playlist_spotlights enable row level security;
create policy "Anyone can read playlist spotlights" on playlist_spotlights for select using (true);
