-- Events: gig / listening-session / album-launch landing pages.
-- Run this in the Supabase SQL editor.

create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  artist_id    uuid not null references artists(id) on delete cascade,
  title        text not null,
  slug         text not null unique,
  description  text default '',
  cover_url    text,
  start_at     timestamptz not null,
  venue        text default '',
  city         text default '',
  ticket_url   text,
  is_published boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table events enable row level security;
create policy "Anyone can read published events" on events for select using (is_published = true);
