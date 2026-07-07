-- Fan Wall: fans leave notes on the artist page; artist can pin / remove.
-- Run this in the Supabase SQL editor.

alter table artists add column if not exists fan_wall_enabled boolean not null default false;

create table if not exists fan_wall_notes (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  name        text not null default '',
  message     text not null,
  is_pinned   boolean not null default false,
  is_approved boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table fan_wall_notes enable row level security;
create policy "Anyone can read approved notes" on fan_wall_notes for select using (is_approved = true);
