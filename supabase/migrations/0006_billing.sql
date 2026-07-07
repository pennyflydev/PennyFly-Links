-- Subscription tracking for Stripe billing.
-- Run this in the Supabase SQL editor.
-- (profiles already has stripe_customer_id / stripe_subscription_id.)

alter table profiles add column if not exists subscription_status text;
alter table profiles add column if not exists current_period_end  timestamptz;
