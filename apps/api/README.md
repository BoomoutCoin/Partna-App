# @partna/api

Fastify v4 API for PartNA Wallet. Hosts wallet auth, pool metadata CRUD,
invite links, notification dispatch (Alchemy webhook → Expo push), and Stripe
subscription management.

## Stack

- **Fastify v4** (TypeScript, ESM)
- **Supabase** (Postgres + RLS; service-role key server-side only)
- **`@fastify/jwt`** (HS256, `JWT_SECRET`)
- **`viem`** (wallet signature verification — Step 5)
- **`zod`** (env validation + request body schemas)
- **`pino`** + `pino-pretty` for structured logs

## Running

```bash
# From repo root
pnpm install

# Copy .env.example → .env and fill in Supabase + JWT_SECRET at minimum
cp apps/api/.env.example apps/api/.env

# Dev with hot reload
pnpm --filter @partna/api dev

# Production build
pnpm --filter @partna/api build
pnpm --filter @partna/api start
```

## Endpoints (current — more added in later steps)

| Method | Path              | Auth | Purpose                                             |
|--------|-------------------|------|-----------------------------------------------------|
| GET    | /health           | none | Liveness (cheap)                                    |
| GET    | /health/ready     | none | Readiness — pings Supabase                          |
| POST   | /auth/nonce       | none | Issue signed sign-in challenge for a wallet         |
| POST   | /auth/wallet      | none | Verify wallet signature → upsert user → session JWT |
| POST   | /auth/privy       | none | Stub (501) — wired in Step 6 with mobile client     |
| POST   | /auth/refresh     | JWT  | Refresh session JWT                                 |
| DELETE | /auth/signout     | JWT  | Client-side signout (204)                           |
| GET    | /users/me         | JWT  | Current user profile                                |
| PUT    | /users/me         | JWT  | Update display_name / avatar_url                    |
| GET    | /users/:address   | none | Public profile lookup                               |

All future routes live under `src/routes/*.ts` and are registered from
`src/server.ts`.

## Deploying

Railway config is in [`railway.json`](./railway.json). Point Railway at the
repo, set all env vars from `.env.example`, and it will build + run using
pnpm workspace filters.

## Structure

```
apps/api/
├── railway.json                 Railway deploy config
├── .env.example
├── tsconfig.json                typecheck (strict, noEmit)
├── tsconfig.build.json          emit for prod build
├── package.json
└── src/
    ├── index.ts                 boot + graceful shutdown
    ├── server.ts                buildServer() factory
    ├── config.ts                zod-validated env
    ├── db.ts                    supabaseAdmin + supabaseAnon
    ├── plugins/
    │   └── auth.ts              @fastify/jwt + authenticate decorator
    ├── routes/
    │   └── health.ts            GET /health, /health/ready
    └── types/
        └── fastify.d.ts         request.user type augmentation
```
