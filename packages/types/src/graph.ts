/**
 * Shapes returned by The Graph subgraph (Apollo Client queries).
 *
 * These are the on-wire strings (bigint → decimal string) — the hook layer
 * (usePool, useMyPools) converts to the bigint-typed `Pool` before returning.
 */

import type { Address } from "./pool.js";

export interface SubgraphPool {
  id: Address;
  organiser: Address;
  status: "FILLING" | "ACTIVE" | "COMPLETED";
  contribution: string;   // bigint as decimal string
  numMembers: number;
  intervalSeconds: string;
  currentCycle: number;
  cycleDeadline: string;
  currentPot: string;
  totalContributed: string;
  feeBps: number;
  createdAt: string;
  members: SubgraphMember[];
}

export interface SubgraphMember {
  id: string; // composite: poolId-address
  address: Address;
  rotationIndex: number;
  hasReceivedPayout: boolean;
  slashed: boolean;
  paidThisCycle: boolean;
  onTimeCycles: number;
  totalCycles: number;
  joinedAt: string;
}

export interface PoolQueryResult {
  pool: SubgraphPool | null;
}

export interface MyPoolsQueryResult {
  members: Array<{
    pool: SubgraphPool;
  }>;
}
