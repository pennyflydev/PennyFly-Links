-- Bandsintown auto-import: sync an artist's tour dates into Events.
-- Run this in the Supabase SQL editor.

-- The artist's Bandsintown handle (name or id), so re-imports know the source.
alter table artists add column if not exists bandsintown_artist text;

-- Track where an event came from + its id in that source, so re-importing
-- updates the existing row instead of creating duplicates.
alter table events add column if not exists source      text not null default 'manual';
alter table events add column if not exists external_id  text;

-- One row per (artist, external event). Partial so manual events (null
-- external_id) are unaffected.
create unique index if not exists events_artist_external_idx
  on events (artist_id, external_id) where external_id is not null;
