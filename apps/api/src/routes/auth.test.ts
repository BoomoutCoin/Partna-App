/**
 * Integration test for the /auth/nonce → /auth/wallet → /users/me flow.
 *
 * Run with:
 *   pnpm --filter @partna/api test
 *
 * We stub Supabase at the module level so no real DB is needed. Signature
 * verification and JWT issuance still run for real.
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";

// ---------- Stub Supabase BEFORE config/db load ----------
// Ensure the env required by config.ts is present.
process.env.NODE_ENV ??= "test";
process.env.PORT ??= "3099";
process.env.HOST ??= "127.0.0.1";
process.env.LOG_LEVEL ??= "silent";
process.env.SUPABASE_URL ??= "https://test.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "test-anon-key-not-real";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key-not-real";
process.env.JWT_SECRET ??= "test-jwt-secret-at-least-32-chars-long-unit-test";

// Intercept `@supabase/supabase-js` with a minimal chainable stub before
// `../db.js` gets imported.
mock.module("@supabase/supabase-js", {
  namedExports: {
    createClient: () => makeStubClient(),
  },
});

function makeStubClient() {
  const users: Record<string, Record<string, unknown>> = {};
  return {
    from(_table: string) {
      const self = {
        _filterCol: null as string | null,
        _filterVal: null as string | null,
        _singleMode: false,
        _maybeMode: false,
        select(_cols: string, _opts?: { count?: string; head?: boolean }) {
          return self;
        },
        upsert(row: { wallet_address: string }) {
          users[row.wallet_address] = {
            wallet_address: row.wallet_address,
            display_name: null,
            avatar_url: null,
            on_time_rate: 0,
            is_pro: false,
            created_at: new Date().toISOString(),
          };
          return Promise.resolve({ data: null, error: null });
        },
        update(row: Record<string, unknown>) {
          return {
            eq(_col: string, val: string) {
              if (users[val]) Object.assign(users[val], row);
              return this;
            },
            select() { return this; },
            single() {
              return Promise.resolve({ data: users[self._filterVal!] ?? null, error: null });
            },
          };
        },
        eq(col: string, val: string) {
          self._filterCol = col;
          self._filterVal = val;
          return self;
        },
        single() {
          self._singleMode = true;
          return Promise.resolve({ data: users[self._filterVal!] ?? null, error: null });
        },
        maybeSingle() {
          self._maybeMode = true;
          return Promise.resolve({ data: users[self._filterVal!] ?? null, error: null });
        },
      };
      return self;
    },
  };
}

// ---------- Actual imports (after stub) ----------

const { buildServer } = await import("../server.js");
const { privateKeyToAccount, generatePrivateKey } = await import("viem/accounts");
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

before(async () => {
  app = await buildServer();
  await app.ready();
});

after(async () => {
  await app.close();
});

test("nonce → wallet sign-in → users/me round trip", async () => {
  // 1. Generate a fresh wallet.
  const account = privateKeyToAccount(generatePrivateKey());
  const walletAddress = account.address.toLowerCase();

  // 2. Ask for a nonce.
  const nonceRes = await app.inject({
    method: "POST",
    url: "/auth/nonce",
    payload: { walletAddress },
  });
  assert.equal(nonceRes.statusCode, 200, `nonce status: ${nonceRes.body}`);
  const { message, challengeToken, nonce } = nonceRes.json() as {
    message: string;
    challengeToken: string;
    nonce: `0x${string}`;
  };
  assert.ok(message.includes(nonce), "message should embed the nonce");

  // 3. Sign the message.
  const signature = await account.signMessage({ message });

  // 4. Exchange for session JWT.
  const walletRes = await app.inject({
    method: "POST",
    url: "/auth/wallet",
    payload: { walletAddress, message, signature, challengeToken },
  });
  assert.equal(walletRes.statusCode, 200, `wallet status: ${walletRes.body}`);
  const { jwt } = walletRes.json() as { jwt: string; walletAddress: string };
  assert.ok(jwt.split(".").length === 3, "should be a JWT");

  // 5. Protected route works with the JWT.
  const meRes = await app.inject({
    method: "GET",
    url: "/users/me",
    headers: { authorization: `Bearer ${jwt}` },
  });
  assert.equal(meRes.statusCode, 200, `users/me status: ${meRes.body}`);
  const { user } = meRes.json() as { user: { wallet_address: string } };
  assert.equal(user.wallet_address, walletAddress);

  // 6. Protected route rejects a missing JWT.
  const unauthRes = await app.inject({ method: "GET", url: "/users/me" });
  assert.equal(unauthRes.statusCode, 401);
});

test("rejects tampered signature", async () => {
  const account = privateKeyToAccount(generatePrivateKey());
  const walletAddress = account.address.toLowerCase();

  const nonceRes = await app.inject({
    method: "POST",
    url: "/auth/nonce",
    payload: { walletAddress },
  });
  const { message, challengeToken } = nonceRes.json() as {
    message: string;
    challengeToken: string;
  };

  // Sign a DIFFERENT message, present the original one → sig verify fails.
  const signature = await account.signMessage({ message: "not the real message" });

  const walletRes = await app.inject({
    method: "POST",
    url: "/auth/wallet",
    payload: { walletAddress, message, signature, challengeToken },
  });
  assert.equal(walletRes.statusCode, 401);
});

test("rejects wallet address mismatch", async () => {
  const signerAccount = privateKeyToAccount(generatePrivateKey());
  const impostorAccount = privateKeyToAccount(generatePrivateKey());

  const nonceRes = await app.inject({
    method: "POST",
    url: "/auth/nonce",
    payload: { walletAddress: impostorAccount.address.toLowerCase() },
  });
  const { message, challengeToken } = nonceRes.json() as {
    message: string;
    challengeToken: string;
  };

  // signer signs the message, but we claim to be impostor
  const signature = await signerAccount.signMessage({ message });
  const walletRes = await app.inject({
    method: "POST",
    url: "/auth/wallet",
    payload: {
      walletAddress: impostorAccount.address.toLowerCase(),
      message,
      signature,
      challengeToken,
    },
  });
  assert.equal(walletRes.statusCode, 401);
});

test("POST /auth/privy returns 501", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/auth/privy",
    payload: { privyToken: "anything" },
  });
  assert.equal(res.statusCode, 501);
});
