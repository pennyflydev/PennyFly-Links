-- Media embeds: live Spotify / YouTube / Apple Music / SoundCloud players
-- embedded directly on the artist page.
-- Run this in the Supabase SQL editor.

create table if not exists media_embeds (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references artists(id) on delete cascade,
  url        text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table media_embeds enable row level security;
create policy "Anyone can read media embeds" on media_embeds for select using (true);
