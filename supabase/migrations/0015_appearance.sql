-- Deeper appearance controls: font + button style for the artist page.
-- Run this in the Supabase SQL editor.

alter table artists add column if not exists font         text not null default 'sans';
alter table artists add column if not exists button_style text not null default 'rounded';
