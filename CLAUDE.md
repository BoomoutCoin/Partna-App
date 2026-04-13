# PartNA Wallet — Project Briefing for Claude Code

You are the senior engineer for **PartNA Wallet**, a mobile dApp that brings West African
rotating savings circles (susu/esusu/tontine) to the Base blockchain. Read this entire file
before writing any code. Every architectural decision here was made deliberately.

---

## What this app does

Members join a pool, lock a security deposit, and take turns receiving the full pot every
cycle. Smart contracts enforce contributions and automate payouts via Chainlink. The security
deposit stays locked even after a member receives their payout — this solves the #1 failure
mode of traditional susu (dropout after payout).

**North star metric:** on-time contribution rate ≥ 90% (vs ~60% in traditional susu).

---

## Monorepo structure

```
partna-wallet/
├── apps/
│   ├── mobile/          # React Native + Expo
│   └── api/             # Node.js + Fastify
├── contracts/           # Solidity + Foundry
│   ├── src/
│   ├── test/
│   └── subgraph/        # The Graph schema + mappings
└── packages/
    └── types/           # Shared TypeScript types (Pool, User, NotificationData, ABIs)
```

Use `pnpm workspaces`. Root `package.json` has `"workspaces": ["apps/*", "packages/*"]`.

---

## Framework decisions — do not revisit these

| Layer | Choice | Reason |
|---|---|---|
| Mobile | React Native 0.74 + Expo SDK 51 | Only mature Web3 ecosystem (wagmi/viem/WalletConnect are JS-first) |
| Router | Expo Router v3 (file-based) | Deep links, tab bar, modals all handled natively |
| Web3 | wagmi v2 + viem | Type-safe contract reads/writes, React hooks |
| Wallet (new users) | Privy embedded wallet | Email/phone OTP, no seed phrase shown, official RN SDK |
| Wallet (crypto users) | WalletConnect v2 | External wallet connect |
| Chain | Base (mainnet 8453, Sepolia 84532) | Sub-cent gas, native USDC, EVM compatible |
| Chain queries | The Graph (Apollo Client) | Subgraph for pool state — no direct RPC polling |
| Server state | React Query (@tanstack/react-query v5) | Caches API responses |
| Client state | Zustand v4 | Auth session, UI toasts |
| Lists | FlashList (@shopify/flash-list) | Never FlatList — performance |
| Animations | Reanimated 3 | UI thread, 60fps |
| Contracts | Solidity 0.8.24 + Foundry | Fuzz tests 50k runs |
| Backend DB | Supabase (Postgres + RLS) | Auth, storage, realtime, admin dashboard |
| Backend API | Fastify v4 + Railway | Webhook processing, push dispatch, Stripe |
| Notifications | Expo Push SDK | Via Fastify — not direct from client |
| Payments | Stripe | Pro subscription tier |
| Error tracking | Sentry | Both mobile and API |

**Never suggest Flutter, Firebase, or Prisma. Never use FlatList. Never use ethers.js (use viem).**

---

## Mobile app — complete file structure

```
apps/mobile/
├── app.config.ts              # Dynamic Expo config (dev/staging/prod environments)
├── src/
│   ├── app/
│   │   ├── _layout.tsx        # Root layout: Providers wrapper + AuthGate + deep link handler
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx      # Splash/auth check screen
│   │   │   ├── onboarding.tsx # 3-slide carousel (dark theme)
│   │   │   └── sign-in.tsx    # Privy OTP + WalletConnect dual path
│   │   ├── (app)/
│   │   │   ├── _layout.tsx    # Tab bar layout (Home, Pools, Activity, Profile)
│   │   │   ├── index.tsx      # Home dashboard
│   │   │   ├── pools/
│   │   │   │   ├── [poolId].tsx   # Pool detail
│   │   │   │   └── create.tsx     # 4-step wizard
│   │   │   ├── activity.tsx
│   │   │   └── profile.tsx
│   │   └── (modals)/
│   │       ├── pay/[poolId].tsx        # Pay Now — MOST CRITICAL SCREEN
│   │       ├── payout-received.tsx     # Celebration screen
│   │       └── join/[code].tsx         # Join via invite link
│   ├── lib/
│   │   ├── providers.tsx      # Provider composition (order matters: Privy→wagmi→Query→Apollo→BottomSheet)
│   │   ├── wagmi.ts           # Chain config, ADDRESSES registry, ERC20_ABI fragment
│   │   ├── graphClient.ts     # Apollo client + GET_POOL + GET_MY_POOLS queries
│   │   ├── queryClient.ts     # React Query client config
│   │   ├── notifications.ts   # registerForPushNotifications(), createNotificationChannels()
│   │   └── api.ts             # ky HTTP client with JWT interceptor
│   ├── store/
│   │   ├── authStore.ts       # Zustand + SecureStore persist (user, jwt)
│   │   └── uiStore.ts         # Zustand (toasts, loading overlay)
│   ├── hooks/
│   │   ├── usePool.ts         # usePool(poolId) + useMyPools(address) — Apollo + React Query merge
│   │   ├── useContribute.ts   # THE MOST IMPORTANT HOOK: allowance→approve→contribute→optimistic update
│   │   ├── useBalance.ts      # USDC balance via wagmi useReadContract, 10s refresh
│   │   └── useDeepLink.ts     # Universal link + notification deep link routing
│   ├── components/
│   │   ├── atoms/
│   │   │   ├── Button.tsx         # 4 variants (primary/secondary/danger/ghost), 3 sizes, loading, haptics
│   │   │   ├── StatusBadge.tsx    # 8 states: paid/pending/due/slashed/receiving/active/filling/completed
│   │   │   ├── Avatar.tsx         # Initials fallback, hash-derived color, ring prop
│   │   │   ├── CycleRing.tsx      # Animated SVG ring showing cycle progress
│   │   │   ├── InputField.tsx     # label, value, error, helper, variant (text/numeric/phone)
│   │   │   └── Skeleton.tsx       # Shimmer placeholder for async components
│   │   ├── molecules/
│   │   │   ├── PoolCard.tsx        # Derives accent color + badge from pool data + userAddress
│   │   │   ├── MemberRow.tsx       # Avatar + name + truncated address + status badge
│   │   │   ├── AmountDisplay.tsx   # Large currency display, variant=payout is green
│   │   │   ├── PaymentSummary.tsx  # Balance before / gas / balance after breakdown
│   │   │   ├── NotificationBanner.tsx # urgent(amber) / payout(purple) / info(blue)
│   │   │   ├── WalletAddressRow.tsx   # Truncated address with copy-to-clipboard
│   │   │   ├── StepIndicator.tsx      # 4-step wizard dots with connecting lines
│   │   │   ├── StatCard.tsx           # Metric card (on-time rate, cycles, active pools)
│   │   │   ├── Toast.tsx              # Toast notification + ToastContainer (global)
│   │   │   └── EmptyState.tsx         # Emoji icon + title + subtitle + optional CTA button
│   │   └── organisms/
│   │       ├── BalanceCard.tsx    # SELF-FETCHING: calls useReadContract internally. Dark gradient.
│   │       ├── PoolHeader.tsx     # SELF-FETCHING: usePool(poolId). Pot card + cycle ring + deadline.
│   │       ├── MemberList.tsx     # SELF-FETCHING: usePool(poolId). FlashList of MemberRow.
│   │       └── OnboardingSlide.tsx # Dark card, icon, dots, next/skip buttons
│   └── theme/
│       ├── colors.ts          # All color tokens — source of truth
│       ├── spacing.ts         # 4/8/12/16/24/32px scale
│       └── typography.ts      # Font sizes, weights, letter-spacing
```

---

## Component architecture rules — enforce these always

1. **Organisms fetch their own data** — `BalanceCard`, `PoolHeader`, `MemberList` call hooks internally. Drop them on a screen and they just work.
2. **Molecules are prop-driven** — receive everything as props, no side effects, no fetching. Easy to test.
3. **Atoms are purely presentational** — no business logic, just styles and callbacks.
4. **Never use FlatList** — always FlashList with `estimatedItemSize`.
5. **Never hardcode addresses** — all contract addresses come from `ADDRESSES` in `lib/wagmi.ts`, populated from `app.config.ts` env.
6. **All USDC amounts as bigint** — 6 decimal places. Use `formatUnits(amount, 6)` for display only.
7. **Every async organism needs a Skeleton variant** — no layout shift on load.

---

## Critical screens — build these with extra care

### Pay Now — `app/(modals)/pay/[poolId].tsx`
- Full-screen modal — **NO tab bar**
- No navigation escape except "Cancel — I'll pay later"
- Large fixed amount display (not editable)
- PaymentSummary component showing balance before/gas/after
- Single primary button: "Confirm payment →"
- useContribute hook handles the full flow:
  1. Biometric auth gate (`expo-local-authentication`)
  2. Check USDC allowance
  3. Approve if needed (shows "Approving USDC…")
  4. Submit contribute() tx (shows "Sending payment…")
  5. Wait for confirmation (shows "Confirming on-chain…")
  6. Optimistic update in React Query cache
  7. Haptic success + toast
- Error states: "User rejected", "Already paid", "Generic failure — balance unchanged"
- `useEffect` dismisses modal 1.5s after `isSuccess`

### Payout Received — `app/(modals)/payout-received.tsx`
- Full-screen dark modal (`#0F1423` background)
- Large green amount with count-up animation (Reanimated 3)
- **Retention copy is always visible before user can dismiss:**
  - "🔐 Your $X deposit stays locked. N more cycles remaining."
  - "Your next contribution is due [date]."
- Share button (native Share API) for organic growth
- "Back to pool →" button to dismiss

### Home — `app/(app)/index.tsx`
- FlashList of PoolCards sorted: urgent-unpaid first, then by deadline
- ListHeaderComponent: BalanceCard + action row + urgent NotificationBanner (if any)
- Pull to refresh
- EmptyState when no pools

---

## Smart contracts — `contracts/src/`

### SusuPool.sol
```
Inherits: ReentrancyGuard, Pausable, VRFConsumerBaseV2Plus, AutomationCompatibleInterface

Key state:
  PoolStatus: FILLING → ACTIVE → COMPLETED
  mapping(address => Member) members
  address[] rotationOrder  (set by Chainlink VRF Fisher-Yates shuffle)
  uint256 cycleDeadline

Key functions:
  join()        — pulls 2× contribution as security deposit, starts VRF when pool fills
  contribute()  — pulls contribution, marks paid, executes payout if all active paid
  performUpkeep() — Chainlink Automation: slashes non-payers after 24h grace, then pays
  fulfillRandomWords() — sets rotation order via Fisher-Yates shuffle

Fee: 0.5% (50 bps) deducted from each payout, sent to feeRecipient
Deposit: stays locked until _completePool() — returned only when all cycles done
Events (indexed by The Graph):
  MemberJoined, PoolActivated, RotationSet, ContributionReceived,
  PayoutExecuted, MemberSlashed, PoolCompleted, DepositReturned
```

### PoolFactory.sol
```
UUPS upgradeable proxy
createPool(contribution, numMembers, intervalSecs) → deploys SusuPool
Constraints: min $10 USDC, max $10k USDC, 3–20 members, $50k TVL cap
Registry: allPools[], poolsByOrganiser[], isRegistered mapping
Emits: PoolCreated (indexed by The Graph)
```

### Foundry config
- `fuzz_runs = 50000`
- Fork tests against Base mainnet
- `via_ir = true` for complex contracts
- Test files: `SusuPool.t.sol` — happy path, slash path, fuzz on amounts, fork tests

**The contracts MUST be audited (Certik or Trail of Bits) before mainnet deployment.**

---

## Backend — `apps/api/`

### Stack
- Node.js 20 + Fastify v4 + TypeScript
- Deployed on Railway (single service, autoscales)
- Supabase Postgres as the database (connection via `@supabase/supabase-js`)

### Database tables (Supabase Postgres)
```sql
users              — wallet_address (unique), display_name, avatar_url, on_time_rate, is_pro
device_tokens      — expo_push_token (unique), user_id FK, platform, is_active
pool_metadata      — contract_address (unique), display_name, organiser_address, is_private
invite_links       — code (unique nanoid), pool_contract_address, max_uses, expires_at, is_active
notifications      — recipient_address, type, title, body, data (jsonb), is_read
webhook_events     — source, tx_hash UNIQUE, event_type, raw_payload (jsonb), processed_at
subscriptions      — stripe_subscription_id (unique), user_id FK, status, current_period_end
analytics_events   — event_name, properties (jsonb), user_id FK
```

### Row-Level Security — always on
- `users`: SELECT/UPDATE own row only (wallet_address = caller)
- `device_tokens`: ALL own tokens only (user_id = auth.uid())
- `pool_metadata`: SELECT public pools, INSERT/UPDATE own pools (organiser)
- `notifications`: SELECT/UPDATE own (recipient_address = caller), INSERT service role only
- `webhook_events`: INSERT/SELECT service role only
- Service role key: **server-side only**, never in client

### API routes
```
POST /auth/wallet            — verify signature, issue JWT
POST /auth/privy             — exchange Privy token for JWT
POST /auth/refresh           — refresh JWT
DELETE /auth/signout

GET/PUT /users/me            — profile CRUD
POST /users/me/avatar        — presigned upload URL flow
GET /users/:walletAddress    — public profile

POST /pools/metadata         — create after contract deploy
GET  /pools/:address         — metadata + member display names
PUT  /pools/:address         — update (organiser only)
GET  /pools/discover         — public pools accepting members

POST   /invites              — create invite link
GET    /invites/:code        — validate code, return pool preview (NO AUTH — for universal links)
POST   /invites/:code/redeem — mark used
DELETE /invites/:code        — revoke

POST /notifications/device   — register Expo push token
DELETE /notifications/device — unregister (on sign-out)
GET  /notifications          — inbox, paginated
PUT  /notifications/read-all
PUT  /notifications/:id/read

GET  /subscriptions/me       — plan status
POST /subscriptions/checkout — Stripe Checkout session URL
POST /subscriptions/portal   — Stripe Customer Portal URL
DELETE /subscriptions/me     — cancel

POST /webhook/alchemy        — HMAC verified, decodes events, dispatches push
POST /webhook/stripe         — Stripe-Signature verified, updates subscription table
```

### Webhook → Push flow
```
SusuPool event on-chain
  → Alchemy Notify webhook → POST /webhook/alchemy
  → HMAC verify (reject if invalid)
  → decodeEventLog(SUSU_POOL_ABI, log)
  → write to webhook_events (idempotent: UNIQUE tx_hash+event_type)
  → write to notifications table
  → fetch device_tokens for recipient(s)
  → expo.sendPushNotificationsAsync() in batches of 100
  → async receipt check 15min later → mark invalid tokens inactive

Target: < 30 seconds from block confirmation to device notification
```

### Push notification types
```
PAYOUT              → PayoutExecuted on-chain → recipient gets high-priority + sound
CONTRIBUTION_CONF   → ContributionReceived → payer gets confirmation
MEMBER_SLASHED      → MemberSlashed → all members notified
PAYMENT_REMINDER    → scheduled cron 48h + 24h before deadline
POOL_FULL           → MemberJoined (last seat) → organiser notified
POOL_COMPLETE       → PoolCompleted → all members, deposits returned message
```

---

## Shared types — `packages/types/src/index.ts`

```typescript
Pool, PoolMember, PoolStatus, MemberStatus
User
NotificationData, NotificationAction ('PAY' | 'PAYOUT' | 'POOL_DETAIL' | 'HOME')
CreatePoolMetaBody, RegisterDeviceBody, CreateInviteResponse
PoolQueryResult  (The Graph response shape)
// Re-exports: SUSU_POOL_ABI, POOL_FACTORY_ABI, ERC20_ABI
```

---

## Environment variables

### Mobile (`apps/mobile/.env`)
```
EXPO_PUBLIC_PRIVY_APP_ID=
EXPO_PUBLIC_ALCHEMY_KEY=
EXPO_PUBLIC_WC_PROJECT_ID=
EAS_PROJECT_ID=
APP_ENV=development
POOL_FACTORY_PROD=        # after contract deploy
POOL_FACTORY_STAGING=     # after contract deploy
```

### API (`apps/api/.env`)
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server only, bypasses RLS
JWT_SECRET=                  # 256-bit random
ALCHEMY_WEBHOOK_SECRET=      # HMAC secret
ALCHEMY_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
EXPO_ACCESS_TOKEN=
ADMIN_JWT_SECRET=
REDIS_URL=                   # optional, for rate limiting
PORT=3001
```

### Contracts (`contracts/.env`)
```
BASE_RPC_URL=
BASE_SEPOLIA_RPC_URL=
BASESCAN_API_KEY=
DEPLOYER_PRIVATE_KEY=
VRF_SUBSCRIPTION_ID=
VRF_COORDINATOR_BASE=0x...
VRF_KEY_HASH=0x...
USDC_BASE=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
USDC_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

---

## Hosting

| Service | What | Tier |
|---|---|---|
| Supabase | Database, Auth, Storage, Realtime | Free → Pro $25/mo |
| Railway | Fastify API | Hobby $5 → ~$20/mo |
| Alchemy | RPC + Webhooks | Free → Growth $49/mo |
| Cloudflare | DNS + DDoS | Free |
| Expo EAS | Mobile builds + OTA updates | Free 15 builds → $99/mo |
| Sentry | Error monitoring | Free → $26/mo |

---

## Build priority order

Build in this exact sequence — do not skip ahead:

1. **Monorepo scaffold** — `pnpm workspaces`, `packages/types`, `tsconfig` path aliases
2. **Contracts** — `SusuPool.sol` + `PoolFactory.sol` + `foundry.toml` + unit tests
3. **Supabase schema** — all 8 tables + RLS policies + indexes (migration files)
4. **API skeleton** — Fastify server + auth middleware + `/health` endpoint on Railway
5. **Auth flow** — `POST /auth/wallet` signature verification + JWT issuance + SecureStore
6. **Mobile foundation** — `lib/providers.tsx`, `lib/wagmi.ts`, `store/authStore.ts`, `app/_layout.tsx`
7. **Atoms** — Button, StatusBadge, Avatar, Skeleton (design token imports)
8. **Home screen** — BalanceCard organism + PoolCard molecule + useBalance + useMyPools
9. **Pool detail** — PoolHeader + MemberList + usePool
10. **Pay Now modal** — useContribute hook (full lifecycle) + PayNow screen (most important)
11. **Create pool wizard** — 4-step form + PoolFactory contract write
12. **Push notifications** — Alchemy webhook → Fastify → Expo Push full flow
13. **Invite links** — `GET /invites/:code` (public) + universal link deep linking
14. **Payout received screen** — celebration modal + retention copy
15. **Stripe subscriptions** — Pro tier checkout + webhook + access gates
16. **Subgraph** — The Graph schema + mappings + deployment to Base

---

## Non-goals for v1 — do not build these

- Fiat on-ramp (no bank connections)
- Native token / governance
- Yield on locked deposits
- Multi-chain (Base only)
- In-app chat
- Soulbound reputation tokens
- Web app (mobile only)
- KYC/identity verification

---

## Key engineering rules

- **All contract addresses from env** — `ADDRESSES` object in `lib/wagmi.ts`, never hardcoded in components
- **All USDC amounts as bigint** — never use float for money
- **Optimistic updates on every mutation** — update React Query cache before tx confirms, rollback on error
- **Biometric gate before every transaction** — `expo-local-authentication` in `useContribute`
- **Idempotent webhook handling** — `UNIQUE(tx_hash, event_type)` in `webhook_events` table
- **FlashList everywhere** — `estimatedItemSize` required, memo all list item components
- **Skeleton on every async organism** — `if (isLoading) return <ComponentName.Skeleton />`
- **HMAC verification on every webhook** — reject instantly if signature fails, return 401
- **Service role key server-side only** — never in mobile app, never logged, never in error messages
- **TypeScript strict mode** — `"strict": true` in all `tsconfig.json`
- **No `any` types** — use `@partna/types` shared package for all domain types

---

## Design tokens (theme/colors.ts)

```typescript
brand:    { green: '#16A34A', dark: '#14532D' }
ink:      { primary: '#0F1423', secondary: '#374151', muted: '#6B7280', subtle: '#9CA3AF' }
bg:       { primary: '#F2F4F7', surface: '#FFFFFF', elevated: '#F8F9FB' }
border:   rgba(15,20,35,.07)
status: {
  paid:      { bg: '#DCFCE7', text: '#166534' }
  pending:   { bg: '#FEF3C7', text: '#92400E' }
  due:       { bg: '#FEE2E2', text: '#991B1B' }
  slashed:   { bg: '#F3F4F6', text: '#4B5563' }
  receiving: { bg: '#EDE9FE', text: '#5B21B6' }
}
semantic: { success: '#16A34A', warning: '#D97706', danger: '#DC2626', info: '#2563EB' }
```

Typography: Inter/Outfit (headings 700–800, body 400, captions 500)
Animations: always Reanimated 3 (UI thread) — never Animated API

---

## Pre-launch checklist (P0 — non-negotiable)

- [ ] Smart contract audit (Certik or Trail of Bits) before mainnet
- [ ] TVL cap $50k per pool enforced in PoolFactory constructor
- [ ] Gnosis Safe 3-of-5 multisig for admin/fee keys
- [ ] Biometric payment flow tested on real physical devices (not simulator)
- [ ] Cold-start deep link routing tested on real iOS + Android
- [ ] OTP delivery rate >95% verified (Twilio/Privy)
- [ ] Balance check shown at pool creation step 2 (not step 4)
- [ ] Expired invite links return named error (not 404)
- [ ] Payout retention copy always visible before modal dismiss
- [ ] Smart contract incident rate: 0 (hard launch blocker)
