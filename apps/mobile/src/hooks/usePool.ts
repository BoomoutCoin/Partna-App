/**
 * usePool(poolId) + useMyPools(address) — Apollo subgraph + React Query merge.
 *
 * Apollo Client fetches the on-chain data from The Graph subgraph.
 * Display metadata (pool name, member display names) is fetched from the
 * Fastify API via React Query.
 */

import { useQuery as useApolloQuery } from "@apollo/client";
import { useQuery } from "@tanstack/react-query";
import type { Address, Pool, PoolMember, PoolStatus, MemberStatus } from "@partna/types";
import type { SubgraphPool, PoolQueryResult, MyPoolsQueryResult } from "@partna/types";

import { GET_POOL, GET_MY_POOLS } from "../lib/graphClient";
import { api } from "../lib/api";

// ---------- Transform subgraph → domain ----------

function toPool(sp: SubgraphPool, meta?: { display_name?: string; is_private?: boolean }): Pool {
  return {
    address: sp.id,
    displayName: meta?.display_name ?? `Pool ${sp.id.slice(0, 8)}`,
    organiser: sp.organiser,
    status: sp.status as PoolStatus,
    contribution: BigInt(sp.contribution),
    depositAmount: BigInt(sp.contribution) * 2n,
    numMembers: sp.numMembers,
    intervalSeconds: Number(sp.intervalSeconds),
    currentCycle: sp.currentCycle,
    cycleDeadline: Number(sp.cycleDeadline),
    currentPot: BigInt(sp.currentPot),
    totalContributed: BigInt(sp.totalContributed),
    feeBps: sp.feeBps,
    members: sp.members.map(
      (m): PoolMember => ({
        address: m.address,
        status: deriveMemberStatus(m),
        rotationIndex: m.rotationIndex,
        hasReceivedPayout: m.hasReceivedPayout,
        onTimeCycles: m.onTimeCycles,
        totalCycles: m.totalCycles,
        joinedAt: Number(m.joinedAt),
      }),
    ),
    isPrivate: meta?.is_private ?? false,
    createdAt: Number(sp.createdAt),
  };
}

function deriveMemberStatus(m: {
  slashed: boolean;
  paidThisCycle: boolean;
  hasReceivedPayout: boolean;
}): MemberStatus {
  if (m.slashed) return "slashed" as MemberStatus;
  if (m.paidThisCycle) return "paid" as MemberStatus;
  return "pending" as MemberStatus;
}

// ---------- Hooks ----------

export function usePool(poolId: Address) {
  const { data: gqlData, loading: gqlLoading } = useApolloQuery<PoolQueryResult>(GET_POOL, {
    variables: { id: poolId.toLowerCase() },
    pollInterval: 15_000,
  });

  const { data: meta, isLoading: metaLoading } = useQuery({
    queryKey: ["pool-meta", poolId],
    queryFn: () => api.get(`pools/${poolId}`).json<{ pool: Record<string, unknown> }>(),
    staleTime: 60_000,
  });

  const isLoading = gqlLoading || metaLoading;
  const pool = gqlData?.pool
    ? toPool(gqlData.pool, meta?.pool as { display_name?: string; is_private?: boolean } | undefined)
    : null;

  return { pool, isLoading };
}

export function useMyPools(address: Address | null) {
  const { data: gqlData, loading: gqlLoading } = useApolloQuery<MyPoolsQueryResult>(
    GET_MY_POOLS,
    {
      variables: { address: address?.toLowerCase() ?? "" },
      skip: !address,
      pollInterval: 30_000,
    },
  );

  const pools: Pool[] = (gqlData?.members ?? []).map((m) => toPool(m.pool));
  return { pools, isLoading: gqlLoading };
}
