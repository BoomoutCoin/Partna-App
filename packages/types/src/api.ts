/**
 * Request/response bodies for the Fastify API in apps/api.
 *
 * Any route that takes a body or returns JSON should use a type declared
 * here so mobile and API stay in sync.
 */

import type { Address } from "./pool.js";

// ---------- Auth ----------

export interface WalletAuthBody {
  walletAddress: Address;
  /** Nonce-based message signed by the wallet. */
  message: string;
  signature: `0x${string}`;
}

export interface PrivyAuthBody {
  privyToken: string;
}

export interface AuthResponse {
  jwt: string;
  expiresAt: number;
}

// ---------- Pools ----------

export interface CreatePoolMetaBody {
  contractAddress: Address;
  displayName: string;
  isPrivate: boolean;
}

export interface UpdatePoolMetaBody {
  displayName?: string;
  isPrivate?: boolean;
}

// ---------- Invites ----------

export interface CreateInviteBody {
  poolContractAddress: Address;
  maxUses?: number;
  expiresInSeconds?: number;
}

export interface CreateInviteResponse {
  code: string;
  url: string;      // universal link, e.g. https://partna.app/i/<code>
  expiresAt: number;
}

export interface InvitePreview {
  code: string;
  poolContractAddress: Address;
  poolDisplayName: string;
  contribution: string; // bigint string
  numMembers: number;
  filledSeats: number;
  organiserDisplayName: string;
  expiresAt: number;
  isExpired: boolean;
}

// ---------- Notifications ----------

export interface RegisterDeviceBody {
  expoPushToken: string;
  platform: "ios" | "android";
}

// ---------- Subscriptions ----------

export interface CheckoutSessionResponse {
  url: string;
}
