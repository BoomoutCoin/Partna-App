#!/bin/bash
# EAS Build hook: runs before npm/yarn/pnpm install
# Ensures pnpm workspace installs from the monorepo root

set -e

echo ">>> EAS pre-install: navigating to monorepo root"
cd ../..

echo ">>> Installing pnpm if not available"
npm install -g pnpm@9 || true

echo ">>> Running pnpm install from monorepo root"
pnpm install --frozen-lockfile || pnpm install

echo ">>> Building @partna/types workspace"
pnpm --filter @partna/types build || true

echo ">>> Pre-install complete, returning to apps/mobile"
cd apps/mobile
