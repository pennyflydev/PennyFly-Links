-- Label campaigns: a promo the label runs across its whole roster's pages.
-- Run this in the Supabase SQL editor.

create table if not exists label_campaigns (
  id         uuid primary key default gen_random_uuid(),
  label_id   uuid not null references labels(id) on delete cascade,
  title      text not null,
  message    text default '',
  url        text,
  cover_url  text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table label_campaigns enable row level security;
create policy "Anyone can read active label campaigns" on label_campaigns for select using (is_active = true);
