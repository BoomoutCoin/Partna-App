# @partna/mobile

React Native + Expo client for PartNA Wallet.

## Running

```bash
# From the repo root
pnpm install

# Copy env file
cp apps/mobile/.env.example apps/mobile/.env

# Start Metro (pick a simulator / device from the CLI menu)
pnpm --filter @partna/mobile start

# Direct iOS / Android
pnpm --filter @partna/mobile ios
pnpm --filter @partna/mobile android
```

## Environment profiles

The `APP_ENV` env var selects the target. Flows through `app.config.ts` → `Constants.expoConfig.extra` → `src/lib/env.ts`.

| APP_ENV       | Bundle ID                    | API               | Chain          |
|---------------|------------------------------|-------------------|----------------|
| `development` | `app.partna.wallet.dev`      | `localhost:3001`  | Base Sepolia   |
| `staging`     | `app.partna.wallet.staging`  | staging URL       | Base Sepolia   |
| `production`  | `app.partna.wallet`          | prod URL          | Base mainnet   |

## Structure

```
apps/mobile/
├── app.config.ts           Dynamic Expo config (3 env profiles)
├── babel.config.js         babel-preset-expo + reanimated plugin (last)
├── metro.config.js         Monorepo-aware watchFolders + nodeModulesPaths
├── package.json            SDK 51 deps (wagmi/viem/apollo/FlashList/…)
├── tsconfig.json           strict, bundler resolution
├── expo-env.d.ts
└── src/
    ├── app/                Expo Router file-based routes
    │   ├── _layout.tsx         root: providers + AuthGate + Stack
    │   ├── (auth)/
    │   │   ├── _layout.tsx
    │   │   ├── index.tsx       → redirect to /sign-in
    │   │   └── sign-in.tsx     dark splash w/ two sign-in CTAs
    │   └── (app)/
    │       ├── _layout.tsx     Tab bar
    │       └── index.tsx       Home placeholder (real one in Step 8)
    ├── lib/
    │   ├── providers.tsx       wagmi → Query → Apollo → GestureHandler
    │   ├── wagmi.ts            Base/Base-Sepolia config + ADDRESSES registry
    │   ├── queryClient.ts      React Query v5 with mobile-tuned defaults
    │   ├── graphClient.ts      Apollo client + GET_POOL / GET_MY_POOLS
    │   ├── api.ts              ky + auto JWT attach + 401 → clearSession
    │   ├── env.ts              Constants.expoConfig.extra accessor
    │   └── notifications.ts    Expo push channel / token registration
    ├── store/
    │   ├── authStore.ts        Zustand + SecureStore persist
    │   └── uiStore.ts          Toasts + loading overlay (ephemeral)
    └── theme/
        ├── colors.ts           Exact hex values from CLAUDE.md
        ├── spacing.ts          4/8/12/16/24/32/48/64
        └── typography.ts       Inter/Outfit scale
```

## Engineering rules (CLAUDE.md)

- Organisms fetch their own data; molecules are prop-driven; atoms are pure
- Never use FlatList — always FlashList with `estimatedItemSize`
- All USDC amounts are `bigint` (6 decimals), display via `formatUnits(_, 6)`
- All contract addresses from `ADDRESSES` in `lib/wagmi.ts`
- Every async organism needs a `Skeleton` variant
- No `any` types — shared domain types come from `@partna/types`
