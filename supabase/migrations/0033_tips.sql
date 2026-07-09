-- Tip jar: fans send an artist a one-off tip via Stripe Connect (destination
-- charge, same 2.5% platform fee as the store/tickets). Enable per artist;
-- completed tips are logged so the artist can see who supported them.

alter table artists add column if not exists tips_enabled boolean not null default false;

create table if not exists tips (
  id             uuid primary key default gen_random_uuid(),
  artist_id      uuid not null references artists(id) on delete cascade,
  amount_cents   integer not null,
  supporter_name text,                                 -- optional, fan-provided
  message        text,                                 -- optional note to the artist
  order_id       text unique,                          -- Stripe checkout session id (idempotency)
  created_at     timestamptz not null default now()
);
alter table tips enable row level security;
-- No public read policy: managed via the admin client, scoped by app code.
create index if not exists tips_artist_idx on tips (artist_id);
