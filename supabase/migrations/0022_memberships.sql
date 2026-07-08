-- Fan memberships: recurring support tiers on the artist page.
-- Run this in the Supabase SQL editor.
-- (Join links work today; native Stripe-Connect subscriptions can be added later.)

create table if not exists membership_tiers (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  name        text not null,
  price_cents integer not null default 0,
  interval    text not null default 'month' check (interval in ('month', 'year')),
  description text default '',
  perks       text[] default '{}',
  join_url    text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table membership_tiers enable row level security;
create policy "Anyone can read active tiers" on membership_tiers for select using (is_active = true);
