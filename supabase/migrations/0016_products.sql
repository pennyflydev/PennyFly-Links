-- Digital product store: sell beats, stems, merch, downloads.
-- Run this in the Supabase SQL editor.
-- (Buy links work today; native Stripe-Connect checkout can be added later.)

create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  artist_id    uuid not null references artists(id) on delete cascade,
  title        text not null,
  description  text default '',
  price_cents  integer not null default 0,
  cover_url    text,
  buy_url      text,
  is_published boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table products enable row level security;
create policy "Anyone can read published products" on products for select using (is_published = true);
