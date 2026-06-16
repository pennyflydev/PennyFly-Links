-- Stores a fan's Spotify authorization for a pre-save so the release-day job
-- can add the track/album to their library when it drops.
-- Run this in the Supabase SQL editor.

create table if not exists spotify_presave_authorizations (
  id              uuid primary key default uuid_generate_v4(),
  campaign_id     uuid not null references presave_campaigns(id) on delete cascade,
  artist_id       uuid not null references artists(id) on delete cascade,
  spotify_user_id text not null,
  email           text,
  refresh_token   text not null,
  target_type     text not null check (target_type in ('album', 'track')),
  target_id       text not null,
  fulfilled       boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (campaign_id, spotify_user_id)
);

alter table spotify_presave_authorizations enable row level security;
