# PartNA Wallet

Rotating savings circles (susu/esusu/tontine) on Base.

> The authoritative spec — architecture, build order, design tokens, API surface,
> engineering rules — lives in [`CLAUDE.md`](./CLAUDE.md). Read it before making
> any architectural decisions.

## Layout

```
partna-wallet/
├── apps/
│   ├── mobile/          # React Native + Expo SDK 51     (Step 6+)
│   └── api/             # Fastify v4 on Railway          (Step 4+)
├── contracts/           # Solidity 0.8.24 + Foundry      (Step 2)
│   └── subgraph/        # The Graph                      (Step 16)
└── packages/
    └── types/           # Shared TS types + ABIs         ✓ Step 1
```

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- Expo CLI (`npm i -g expo`)

## Setup

```bash
pnpm install
pnpm typecheck
```

## Build order

See the "Build priority order" section in [`CLAUDE.md`](./CLAUDE.md#build-priority-order).
Current status: **Step 1 complete** (monorepo scaffold + shared types).
