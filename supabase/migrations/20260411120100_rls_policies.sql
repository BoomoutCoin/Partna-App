-- =====================================================================
-- Row-Level Security policies
-- =====================================================================
-- Per CLAUDE.md:
--   users           — SELECT/UPDATE own row only
--   device_tokens   — ALL own tokens only
--   pool_metadata   — SELECT public pools, INSERT/UPDATE own (organiser)
--   notifications   — SELECT/UPDATE own, INSERT service role only
--   webhook_events  — INSERT/SELECT service role only
--   subscriptions   — SELECT own, writes service role only
--   invite_links    — SELECT public for preview, writes by organiser
--   analytics       — INSERT by owning user, SELECT service role only
--
-- Wallet identity is read from the custom JWT claim via public.current_wallet_address().
-- The API (with service role key) bypasses all policies.
-- =====================================================================

alter table public.users             enable row level security;
alter table public.device_tokens     enable row level security;
alter table public.pool_metadata     enable row level security;
alter table public.invite_links      enable row level security;
alter table public.notifications     enable row level security;
alter table public.webhook_events    enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.analytics_events  enable row level security;

-- ---------- users ----------
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select using (wallet_address = public.current_wallet_address());

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update using (wallet_address = public.current_wallet_address())
             with check (wallet_address = public.current_wallet_address());

-- Public profile lookups by others are served by the API, not direct client.

-- ---------- device_tokens ----------
drop policy if exists device_tokens_all_own on public.device_tokens;
create policy device_tokens_all_own on public.device_tokens
  for all using (wallet_address = public.current_wallet_address())
          with check (wallet_address = public.current_wallet_address());

-- ---------- pool_metadata ----------
-- Anyone can read non-private pools (public discovery).
drop policy if exists pool_metadata_select_public on public.pool_metadata;
create policy pool_metadata_select_public on public.pool_metadata
  for select using (
    is_private = false
    or organiser_address = public.current_wallet_address()
  );

-- Only the organiser can create or edit a pool's metadata.
drop policy if exists pool_metadata_insert_organiser on public.pool_metadata;
create policy pool_metadata_insert_organiser on public.pool_metadata
  for insert with check (organiser_address = public.current_wallet_address());

drop policy if exists pool_metadata_update_organiser on public.pool_metadata;
create policy pool_metadata_update_organiser on public.pool_metadata
  for update using (organiser_address = public.current_wallet_address())
             with check (organiser_address = public.current_wallet_address());

-- ---------- invite_links ----------
-- Anonymous invite preview is served by the API (service role).
-- Logged-in organisers may list + mutate their own invites.
drop policy if exists invite_links_select_own on public.invite_links;
create policy invite_links_select_own on public.invite_links
  for select using (created_by = public.current_wallet_address());

drop policy if exists invite_links_insert_own on public.invite_links;
create policy invite_links_insert_own on public.invite_links
  for insert with check (created_by = public.current_wallet_address());

drop policy if exists invite_links_update_own on public.invite_links;
create policy invite_links_update_own on public.invite_links
  for update using (created_by = public.current_wallet_address())
             with check (created_by = public.current_wallet_address());

drop policy if exists invite_links_delete_own on public.invite_links;
create policy invite_links_delete_own on public.invite_links
  for delete using (created_by = public.current_wallet_address());

-- ---------- notifications ----------
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (recipient_address = public.current_wallet_address());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (recipient_address = public.current_wallet_address())
             with check (recipient_address = public.current_wallet_address());

-- No INSERT / DELETE policy → only service role can write.

-- ---------- webhook_events ----------
-- No policies at all → only service role has access. This is intentional;
-- webhook idempotency must never be readable or writable by clients.

-- ---------- subscriptions ----------
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
  for select using (wallet_address = public.current_wallet_address());

-- Writes only via Stripe webhook handler using the service role key.

-- ---------- analytics_events ----------
drop policy if exists analytics_events_insert_own on public.analytics_events;
create policy analytics_events_insert_own on public.analytics_events
  for insert with check (
    wallet_address is null
    or wallet_address = public.current_wallet_address()
  );
-- No SELECT policy → raw event reads service role only.
