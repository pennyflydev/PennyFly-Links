-- Device analytics: record mobile / tablet / desktop on each event.
-- Run this in the Supabase SQL editor.

alter table analytics_events add column if not exists device text;
