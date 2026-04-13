-- Local dev seed data. Runs after migrations via `supabase db reset`.
-- Do NOT put anything production-sensitive in here.

-- A couple of synthetic users for local testing.
insert into public.users (wallet_address, display_name, is_pro)
values
  ('0x1111111111111111111111111111111111111111', 'Alice (dev)', false),
  ('0x2222222222222222222222222222222222222222', 'Bob (dev)', true),
  ('0x3333333333333333333333333333333333333333', 'Carol (dev)', false)
on conflict (wallet_address) do nothing;
