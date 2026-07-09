-- Paid unlocks: an exclusive_content item with price_cents > 0 becomes a
-- pay-to-reveal item (one-time Stripe Connect payment) instead of the free
-- Spotify-follow gate. price_cents = 0 keeps the existing follow-to-unlock.
-- The `unlocks` table records who paid so the reward can be revealed + receipted.

alter table exclusive_content add column if not exists price_cents integer not null default 0;

create table if not exists unlocks (
  id           uuid primary key default gen_random_uuid(),
  exclusive_id uuid references exclusive_content(id) on delete set null,
  artist_id    uuid not null references artists(id) on delete cascade,
  amount_cents integer not null,
  buyer_name   text,
  buyer_email  text,
  order_id     text unique,                          -- Stripe checkout session id (idempotency + reveal lookup)
  created_at   timestamptz not null default now()
);
alter table unlocks enable row level security;
-- No public read policy: managed via the admin client, scoped by app code.
create index if not exists unlocks_artist_idx on unlocks (artist_id);
create index if not exists unlocks_order_idx on unlocks (order_id);
