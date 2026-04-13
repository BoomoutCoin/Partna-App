# Supabase — PartNA Wallet database

## Structure

```
supabase/
├── config.toml                                 # Local CLI config
├── seed.sql                                    # Local dev seed (3 test users)
└── migrations/
    ├── 20260411120000_init_schema.sql          # 8 tables + enums + helpers
    ├── 20260411120100_rls_policies.sql         # All RLS policies
    └── 20260411120200_indexes.sql              # Performance indexes
```

## Identity model — important

PartNA Wallet does **not** use Supabase Auth as its identity system. Instead:

1. `apps/api` (Fastify) issues its own JWTs signed with `JWT_SECRET` after
   verifying a wallet signature or exchanging a Privy token.
2. Those JWTs contain a `wallet_address` custom claim.
3. RLS policies read that claim via `public.current_wallet_address()` — a
   helper function defined in `20260411120000_init_schema.sql`.
4. The API connects with the **service role key** for writes, which bypasses
   RLS entirely. Policies are defense-in-depth for:
   - Direct client queries (e.g. Supabase Realtime channels)
   - Protecting against service-role-key leaks at the table level
   - Local dev read-only inspection

For direct client RLS to work with our custom JWTs, Supabase must be configured
to accept them. Set `GOTRUE_JWT_SECRET` (or the equivalent Supabase dashboard
setting) to the same `JWT_SECRET` the API uses.

## Applying migrations

### Local (Supabase CLI)

```bash
# Start the stack
supabase start

# Apply migrations + run seed
supabase db reset

# After editing a migration file or adding a new one
supabase db push
```

### Hosted Supabase (prod / staging)

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste the SQL files into the Supabase SQL editor in order:
1. `20260411120000_init_schema.sql`
2. `20260411120100_rls_policies.sql`
3. `20260411120200_indexes.sql`

## Schema overview

| Table             | PK                  | Key purpose                                          |
|-------------------|---------------------|------------------------------------------------------|
| `users`           | `wallet_address`    | Profile, on-time rate, Pro flag                      |
| `device_tokens`   | `id` (uuid)         | Expo push token registration                          |
| `pool_metadata`   | `contract_address`  | Off-chain display name / privacy for SusuPool        |
| `invite_links`    | `code`              | Short invite codes for universal-link joins          |
| `notifications`   | `id` (uuid)         | In-app inbox + push audit log                        |
| `webhook_events`  | `id` (uuid)         | Idempotent Alchemy / Stripe webhook dedupe           |
| `subscriptions`   | `id` (uuid)         | Stripe Pro subscription state per user               |
| `analytics_events`| `id` (bigserial)    | Funnel + retention event log                         |

## RLS policies — summary

All 8 tables have RLS enabled. A quick map:

| Table             | SELECT                         | INSERT                    | UPDATE / DELETE              |
|-------------------|---------------------------------|---------------------------|------------------------------|
| `users`           | own                             | service role              | own                          |
| `device_tokens`   | own                             | own                       | own                          |
| `pool_metadata`   | public OR own (private)         | own (organiser)           | own (organiser)              |
| `invite_links`    | own                             | own                       | own                          |
| `notifications`   | own (recipient)                 | service role              | own (mark read)              |
| `webhook_events`  | service role                    | service role              | service role                 |
| `subscriptions`   | own                             | service role              | service role                 |
| `analytics_events`| service role                    | own (or anon)             | —                            |

`own` = `column = public.current_wallet_address()`
