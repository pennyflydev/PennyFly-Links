-- Ticketing: artist-run ticket sales for Events. Fans buy/claim a ticket with
-- a unique QR token; single-scan redemption at the door. Run in Supabase.

create table if not exists ticket_types (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  artist_id   uuid not null references artists(id) on delete cascade,
  name        text not null,
  price_cents integer not null default 0,     -- 0 = free (RSVP)
  quantity    integer,                         -- null = unlimited
  sold        integer not null default 0,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table ticket_types enable row level security;
-- Public can read active ticket types (to show them on the event page).
drop policy if exists "Anyone can read active ticket types" on ticket_types;
create policy "Anyone can read active ticket types" on ticket_types for select using (is_active = true);

create table if not exists tickets (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  artist_id      uuid not null references artists(id) on delete cascade,
  ticket_type_id uuid references ticket_types(id) on delete set null,
  token          text not null unique,         -- what the QR encodes
  buyer_name     text,
  buyer_email    text,
  status         text not null default 'valid' check (status in ('valid', 'used', 'refunded')),
  checked_in_at  timestamptz,
  order_id       text,                          -- stripe session/payment id (paid)
  created_at     timestamptz not null default now()
);
alter table tickets enable row level security;
-- No public read: tickets are fetched by unguessable token via the admin client.
create index if not exists tickets_event_idx on tickets (event_id);
create index if not exists tickets_token_idx on tickets (token);
