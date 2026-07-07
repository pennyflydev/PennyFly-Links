-- Web push: fans subscribe to an artist's drop alerts.
-- Run this in the Supabase SQL editor.

create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references artists(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  unique (artist_id, endpoint)
);

alter table push_subscriptions enable row level security;
