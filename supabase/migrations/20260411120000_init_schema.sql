-- =====================================================================
-- PartNA Wallet — initial schema
-- =====================================================================
-- Spec: CLAUDE.md § "Backend — apps/api" → "Database tables"
--
-- Identity model:
--   All rows are keyed by Ethereum `wallet_address` (0x + 40 hex, lowercase).
--   The API (apps/api) issues its own JWTs with a `wallet_address` claim and
--   uses the Supabase *service role* key for all writes (RLS-bypassing).
--   The RLS policies in 20260411120100_rls_policies.sql are defense-in-depth
--   for any future direct client reads (Supabase realtime, anon key pull, etc.).
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";     -- gen_random_uuid
create extension if not exists "citext";       -- case-insensitive text

-- ---------- Domains ----------
-- Ethereum address: 0x + 40 hex chars, stored lowercase.
create domain wallet_address as text
  check (value ~ '^0x[0-9a-f]{40}$');

-- nanoid for invite codes (21 chars url-safe).
create domain invite_code as text
  check (length(value) between 8 and 32);

-- ---------- Enums ----------
do $$ begin
  create type notification_type as enum (
    'PAYOUT',
    'CONTRIBUTION_CONF',
    'MEMBER_SLASHED',
    'PAYMENT_REMINDER',
    'POOL_FULL',
    'POOL_COMPLETE'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_action as enum ('PAY', 'PAYOUT', 'POOL_DETAIL', 'HOME');
exception when duplicate_object then null; end $$;

do $$ begin
  create type device_platform as enum ('ios', 'android');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum (
    'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type webhook_source as enum ('alchemy', 'stripe');
exception when duplicate_object then null; end $$;

-- ---------- Helper: extract wallet address from custom JWT claim ----------
-- Fastify JWTs include `wallet_address` as a top-level claim. Call this
-- from RLS policies instead of `auth.uid()`.
--
-- Lives in `public` rather than `auth` so the migration can run without
-- elevated schema privileges on hosted Supabase.
create or replace function public.current_wallet_address() returns text
language sql stable as $$
  select nullif(
    (coalesce(auth.jwt(), '{}'::jsonb) ->> 'wallet_address'),
    ''
  );
$$;

-- ---------- 1. users ----------
create table if not exists public.users (
  wallet_address wallet_address primary key,
  display_name   text,
  avatar_url     text,
  -- Rolling on-time contribution rate (0.0 .. 1.0). Updated by API after each cycle.
  on_time_rate   numeric(5,4) not null default 0 check (on_time_rate between 0 and 1),
  is_pro         boolean      not null default false,
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now()
);

-- ---------- 2. device_tokens ----------
create table if not exists public.device_tokens (
  id              uuid primary key default gen_random_uuid(),
  wallet_address  wallet_address not null references public.users(wallet_address) on delete cascade,
  expo_push_token text not null unique,
  platform        device_platform not null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  last_used_at    timestamptz
);

-- ---------- 3. pool_metadata ----------
-- Off-chain metadata layered on top of SusuPool contracts. The contract holds
-- the source of truth for state; this table holds human-readable display info.
create table if not exists public.pool_metadata (
  contract_address    wallet_address primary key,
  display_name        text not null check (char_length(display_name) between 1 and 80),
  organiser_address   wallet_address not null references public.users(wallet_address),
  description         text,
  is_private          boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------- 4. invite_links ----------
create table if not exists public.invite_links (
  code                    invite_code primary key,
  pool_contract_address   wallet_address not null references public.pool_metadata(contract_address) on delete cascade,
  created_by              wallet_address not null references public.users(wallet_address),
  max_uses                integer check (max_uses is null or max_uses > 0),
  use_count               integer not null default 0,
  expires_at              timestamptz not null,
  is_active               boolean not null default true,
  created_at              timestamptz not null default now()
);

-- ---------- 5. notifications ----------
create table if not exists public.notifications (
  id                  uuid primary key default gen_random_uuid(),
  recipient_address   wallet_address not null references public.users(wallet_address) on delete cascade,
  type                notification_type not null,
  action              notification_action not null,
  title               text not null,
  body                text not null,
  data                jsonb not null default '{}'::jsonb,
  is_read             boolean not null default false,
  created_at          timestamptz not null default now(),
  read_at             timestamptz
);

-- ---------- 6. webhook_events ----------
-- Idempotency table: prevents double-processing of Alchemy / Stripe webhooks
-- when the upstream retries. Combined unique key (tx_hash, event_type) means
-- the same on-chain event is only handled once.
create table if not exists public.webhook_events (
  id             uuid primary key default gen_random_uuid(),
  source         webhook_source not null,
  tx_hash        text,
  event_type     text not null,
  raw_payload    jsonb not null,
  processed_at   timestamptz,
  created_at     timestamptz not null default now(),
  constraint webhook_events_dedupe unique (source, tx_hash, event_type)
);

-- ---------- 7. subscriptions ----------
create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  wallet_address         wallet_address not null unique references public.users(wallet_address) on delete cascade,
  stripe_customer_id     text not null,
  stripe_subscription_id text not null unique,
  status                 subscription_status not null,
  current_period_end     timestamptz not null,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ---------- 8. analytics_events ----------
create table if not exists public.analytics_events (
  id              bigserial primary key,
  event_name      text not null,
  properties      jsonb not null default '{}'::jsonb,
  wallet_address  wallet_address references public.users(wallet_address) on delete set null,
  created_at      timestamptz not null default now()
);

-- ---------- updated_at triggers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists pool_metadata_set_updated_at on public.pool_metadata;
create trigger pool_metadata_set_updated_at
  before update on public.pool_metadata
  for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
