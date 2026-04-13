-- =====================================================================
-- Performance indexes
-- =====================================================================
-- Every index here is justified by a specific read pattern in apps/api.
-- Add new indexes in new dated migration files; never edit this one
-- retroactively after it ships to production.
-- =====================================================================

-- users: public profile lookups by wallet already hit the PK.
-- No extra indexes needed.

-- device_tokens: "push all tokens for recipient X of this notification"
create index if not exists device_tokens_wallet_active_idx
  on public.device_tokens (wallet_address) where is_active;

-- pool_metadata: discover feed = "public pools sorted by recency"
create index if not exists pool_metadata_discover_idx
  on public.pool_metadata (created_at desc) where is_private = false;

-- pool_metadata: "my created pools"
create index if not exists pool_metadata_organiser_idx
  on public.pool_metadata (organiser_address, created_at desc);

-- invite_links: public invite resolution by code is PK lookup. Index on
-- pool_contract_address for "list invites for my pool" organiser view.
create index if not exists invite_links_pool_idx
  on public.invite_links (pool_contract_address)
  where is_active;

create index if not exists invite_links_expires_idx
  on public.invite_links (expires_at) where is_active;

-- notifications: inbox paginated by recipient
create index if not exists notifications_recipient_idx
  on public.notifications (recipient_address, created_at desc);

-- notifications: unread count badge
create index if not exists notifications_unread_idx
  on public.notifications (recipient_address)
  where is_read = false;

-- webhook_events: operational monitoring — recent unprocessed
create index if not exists webhook_events_unprocessed_idx
  on public.webhook_events (source, created_at desc)
  where processed_at is null;

-- subscriptions: cron job that renews / checks expiring subs
create index if not exists subscriptions_period_end_idx
  on public.subscriptions (current_period_end) where status = 'active';

-- analytics_events: event_name + time is the primary aggregation pattern
create index if not exists analytics_events_name_time_idx
  on public.analytics_events (event_name, created_at desc);
