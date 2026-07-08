-- Wallet passes: let fans save an artist "pass" to Google/Apple Wallet.
-- Run this in the Supabase SQL editor.

alter table artists add column if not exists wallet_pass_enabled boolean not null default false;
