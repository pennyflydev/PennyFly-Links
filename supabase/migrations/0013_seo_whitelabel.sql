-- SEO controls + white-label (remove "Powered by FlyLink") on the artist page.
-- Run this in the Supabase SQL editor.

alter table artists add column if not exists seo_title       text;
alter table artists add column if not exists seo_description text;
alter table artists add column if not exists hide_branding   boolean not null default false;
