/**
 * Sign-in challenge issuer.
 *
 * Stateless design: instead of storing nonces in a DB or Redis, we encode the
 * nonce + wallet + expiry into a short-lived JWT ("challenge token") that the
 * API hands out. When the client returns with a signed message, we verify:
 *
 *   1. The challenge token JWT is valid and not expired (same `JWT_SECRET`).
 *   2. The `message` the wallet signed contains the nonce from the token.
 *   3. The recovered signer matches the wallet the client claims.
 *
 * This avoids Redis/Postgres round trips on every sign-in, while still
 * preventing replay (each challenge is single-use-per-expiry window and tied
 * to one wallet).
 */

import { randomBytes } from "node:crypto";
import { getAddress, type Address } from "viem";

/** Short-lived challenge JWT TTL. 5 minutes is enough for the user to unlock a wallet. */
export const CHALLENGE_TTL_SECONDS = 300;

export interface ChallengePayload {
  /** Lowercase wallet address the challenge is tied to. */
  wallet: Address;
  /** 32-byte hex nonce (0x-prefixed). */
  nonce: `0x${string}`;
  /** Marks this JWT as a sign-in challenge, not a session token. */
  purpose: "signin-challenge";
}

export function generateNonce(): `0x${string}` {
  return `0x${randomBytes(32).toString("hex")}`;
}

/**
 * Build the EIP-191 plaintext the client must sign. Must be deterministic
 * from the challenge payload so the server can reconstruct it on verify.
 */
export function buildChallengeMessage(params: {
  walletAddress: Address;
  nonce: `0x${string}`;
  issuedAt: number; // unix seconds
}): string {
  return [
    "PartNA Wallet — Sign in",
    "",
    `Wallet: ${getAddress(params.walletAddress)}`,
    `Nonce: ${params.nonce}`,
    `Issued: ${new Date(params.issuedAt * 1000).toISOString()}`,
    "",
    "By signing this message you authenticate to PartNA Wallet.",
    "This request will not trigger a blockchain transaction or cost any gas.",
  ].join("\n");
}
