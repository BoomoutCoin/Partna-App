/**
 * User profile stored in Supabase `users` table.
 *
 * `wallet_address` is the primary key; Privy and WalletConnect users both map
 * to a single row keyed by on-chain address.
 */

import type { Address } from "./pool.js";

export interface User {
  walletAddress: Address;
  displayName: string | null;
  avatarUrl: string | null;
  /** Rolling average: paid-on-time cycles / total cycles across all pools. */
  onTimeRate: number;
  isPro: boolean;
  createdAt: number;
}

/** JWT claims issued by POST /auth/wallet or POST /auth/privy. */
export interface AuthClaims {
  sub: Address;          // wallet address = subject
  iat: number;
  exp: number;
  /** Auth method used on session start. */
  method: "wallet" | "privy";
}

export interface AuthSession {
  user: User;
  jwt: string;
  expiresAt: number;
}
