/**
 * Auth routes.
 *
 *   POST /auth/nonce     — issue a signed challenge for a wallet to sign
 *   POST /auth/wallet    — verify the signed challenge, upsert user, return session JWT
 *   POST /auth/privy     — (stub) exchange a Privy token for a session JWT
 *   POST /auth/refresh   — refresh an existing session JWT
 *   DELETE /auth/signout — client-side; we just respond 204
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { verifyMessage, isAddress } from "viem";

import { supabaseAdmin } from "../db.js";
import {
  CHALLENGE_TTL_SECONDS,
  buildChallengeMessage,
  generateNonce,
  type ChallengePayload,
} from "../lib/nonce.js";
import { normalizeAddress } from "../lib/address.js";

// ---------- request schemas ----------

const addressString = z.string().refine(isAddress, {
  message: "Invalid EVM address",
});

const nonceBody = z.object({
  walletAddress: addressString,
});

const walletAuthBody = z.object({
  walletAddress: addressString,
  message: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
  challengeToken: z.string().min(1),
});

// ---------- routes ----------

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // ---------- POST /auth/nonce ----------
  // Returns a message to sign + a challenge JWT that wraps (wallet, nonce, exp).
  // Client must echo both back to POST /auth/wallet.
  app.post("/auth/nonce", async (request, reply) => {
    const parsed = nonceBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid body", issues: parsed.error.issues });
    }

    const walletAddress = normalizeAddress(parsed.data.walletAddress);
    const nonce = generateNonce();
    const issuedAt = Math.floor(Date.now() / 1000);

    const message = buildChallengeMessage({ walletAddress, nonce, issuedAt });

    const challengePayload: ChallengePayload = {
      wallet: walletAddress,
      nonce,
      purpose: "signin-challenge",
    };

    const challengeToken = app.jwt.sign(
      // @fastify/jwt's `FastifyJWT.payload` type is narrow; cast locally.
      challengePayload as unknown as { sub: `0x${string}`; method: "wallet" | "privy" },
      { expiresIn: `${CHALLENGE_TTL_SECONDS}s` },
    );

    return reply.send({
      walletAddress,
      nonce,
      message,
      challengeToken,
      expiresAt: issuedAt + CHALLENGE_TTL_SECONDS,
    });
  });

  // ---------- POST /auth/wallet ----------
  app.post("/auth/wallet", async (request, reply) => {
    const parsed = walletAuthBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid body", issues: parsed.error.issues });
    }

    const walletAddress = normalizeAddress(parsed.data.walletAddress);
    const { message, signature, challengeToken } = parsed.data;

    // 1. Verify the challenge token is one we issued and is still valid.
    let challenge: ChallengePayload;
    try {
      challenge = app.jwt.verify<ChallengePayload>(challengeToken);
    } catch (err) {
      request.log.warn({ err }, "challenge token verify failed");
      return reply.code(401).send({ error: "Challenge expired or invalid" });
    }

    if (challenge.purpose !== "signin-challenge") {
      return reply.code(401).send({ error: "Not a sign-in challenge token" });
    }
    if (challenge.wallet !== walletAddress) {
      return reply.code(401).send({ error: "Challenge wallet mismatch" });
    }
    if (!message.includes(challenge.nonce)) {
      return reply.code(401).send({ error: "Message does not reference issued nonce" });
    }

    // 2. Verify the wallet actually signed this message.
    const signatureHex = signature as `0x${string}`;
    const validSig = await verifyMessage({
      address: walletAddress,
      message,
      signature: signatureHex,
    });
    if (!validSig) {
      return reply.code(401).send({ error: "Invalid signature" });
    }

    // 3. Upsert the user row (service role bypasses RLS).
    const { error: upsertErr } = await supabaseAdmin
      .from("users")
      .upsert(
        { wallet_address: walletAddress },
        { onConflict: "wallet_address", ignoreDuplicates: false },
      );
    if (upsertErr) {
      request.log.error({ err: upsertErr }, "user upsert failed");
      return reply.code(500).send({ error: "Database error" });
    }

    // 4. Issue a long-lived session JWT.
    const sessionJwt = app.jwt.sign(
      { sub: walletAddress, method: "wallet" },
      // expiresIn comes from @fastify/jwt default in plugins/auth.ts
    );

    return reply.send({
      jwt: sessionJwt,
      walletAddress,
    });
  });

  // ---------- POST /auth/privy (stub) ----------
  app.post("/auth/privy", async (_request, reply) => {
    // Wired in Step 6 (mobile foundation) once the Privy SDK is installed
    // and we have a real Privy app ID.
    return reply.code(501).send({
      error: "Not Implemented",
      reason: "Privy token exchange wiring lands with the mobile client",
    });
  });

  // ---------- POST /auth/refresh ----------
  app.post(
    "/auth/refresh",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const newJwt = app.jwt.sign({
        sub: request.user.walletAddress,
        method: request.user.method,
      });
      return reply.send({ jwt: newJwt, walletAddress: request.user.walletAddress });
    },
  );

  // ---------- DELETE /auth/signout ----------
  app.delete(
    "/auth/signout",
    { preHandler: [app.authenticate] },
    async (_request, reply) => {
      // JWTs are stateless — signout is purely a client concern (drop token
      // from SecureStore). If we ever need server-side revocation, add a
      // jti blocklist backed by Redis.
      return reply.code(204).send();
    },
  );
}
