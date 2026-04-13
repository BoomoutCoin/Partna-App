/**
 * Pool & member types.
 *
 * Mirrors the on-chain SusuPool state plus off-chain display metadata
 * (display_name, avatars, etc.) joined from Supabase `pool_metadata`.
 */

export type Address = `0x${string}`;

/** Pool lifecycle matches the SusuPool enum. */
export enum PoolStatus {
  FILLING = "FILLING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

/** Per-member state, derived from on-chain `members` mapping. */
export enum MemberStatus {
  /** Has paid the current cycle. */
  PAID = "paid",
  /** Has not paid yet this cycle, before deadline. */
  PENDING = "pending",
  /** Deadline passed, within 24h grace window. */
  DUE = "due",
  /** Deposit slashed — missed contribution. */
  SLASHED = "slashed",
  /** It is this member's turn to receive payout. */
  RECEIVING = "receiving",
  /** Member is active and in good standing (post-payout). */
  ACTIVE = "active",
}

export interface PoolMember {
  address: Address;
  /** Display name from `users` table, falls back to truncated address. */
  displayName?: string;
  avatarUrl?: string;
  status: MemberStatus;
  /** 0-indexed position in the rotation (after VRF shuffle). */
  rotationIndex: number;
  /** Whether this member has already received their payout. */
  hasReceivedPayout: boolean;
  /** Cycles paid on time (for on-time rate calc). */
  onTimeCycles: number;
  /** Total cycles seen. */
  totalCycles: number;
  joinedAt: number; // unix seconds
}

export interface Pool {
  /** SusuPool contract address. */
  address: Address;
  /** Off-chain human-readable name from pool_metadata. */
  displayName: string;
  organiser: Address;
  status: PoolStatus;
  /** Per-cycle contribution amount in USDC wei (6 decimals). */
  contribution: bigint;
  /** Security deposit = 2 × contribution, locked until pool completes. */
  depositAmount: bigint;
  /** Target member count (pool is FILLING until len(members) === numMembers). */
  numMembers: number;
  /** Seconds between cycle deadlines. */
  intervalSeconds: number;
  /** 1-indexed cycle number. 0 while FILLING. */
  currentCycle: number;
  /** Unix seconds when the current cycle contributions are due. */
  cycleDeadline: number;
  /** Total pot for the current cycle (contribution × activeMembers). */
  currentPot: bigint;
  /** Running total of contributions ever made to this pool (for analytics). */
  totalContributed: bigint;
  /** Fee bps (always 50 = 0.5% per spec). */
  feeBps: number;
  /** Ordered list of members (rotation order once ACTIVE). */
  members: PoolMember[];
  /** Privacy flag from pool_metadata. */
  isPrivate: boolean;
  createdAt: number;
}

/** Result of creating a pool via PoolFactory.createPool(). */
export interface CreatePoolResult {
  poolAddress: Address;
  txHash: `0x${string}`;
}
