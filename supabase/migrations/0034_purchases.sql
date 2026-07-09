-- Store purchases: records a completed digital-product sale (native Stripe
-- Connect checkout). Closes the gap where product checkouts charged the fan but
-- were never recorded or receipted (tips/tickets were logged, products weren't).

create table if not exists purchases (
  id           uuid primary key default gen_random_uuid(),
  artist_id    uuid not null references artists(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  amount_cents integer not null,
  buyer_name   text,
  buyer_email  text,
  order_id     text unique,                          -- Stripe checkout session id (idempotency)
  created_at   timestamptz not null default now()
);
alter table purchases enable row level security;
-- No public read policy: managed via the admin client, scoped by app code.
create index if not exists purchases_artist_idx on purchases (artist_id);
