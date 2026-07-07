-- Shopify merch connector: artist links their store's Storefront API.
-- Run this in the Supabase SQL editor.
-- (Storefront access tokens are designed for public/client use — low sensitivity.)

alter table artists add column if not exists shopify_domain text;
alter table artists add column if not exists shopify_token  text;
