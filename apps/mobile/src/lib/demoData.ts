/**
 * Demo mode mock data — lets the web preview render fully without
 * real wallets, Supabase, or chain connections.
 */

import { PoolStatus, MemberStatus, type User, type Pool, type PoolMember, type Address } from "@partna/types";

export const DEMO_WALLET: Address = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

export const DEMO_USER: User = {
  walletAddress: DEMO_WALLET,
  displayName: "Demo User",
  avatarUrl: null,
  onTimeRate: 0.92,
  isPro: false,
  createdAt: Math.floor(Date.now() / 1000) - 86400 * 30,
};

export const DEMO_MEMBERS: PoolMember[] = [
  {
    address: DEMO_WALLET,
    displayName: "You",
    status: MemberStatus.PENDING,
    rotationIndex: 0,
    hasReceivedPayout: false,
    onTimeCycles: 4,
    totalCycles: 4,
    joinedAt: Math.floor(Date.now() / 1000) - 86400 * 14,
  },
  {
    address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    displayName: "Amara",
    status: MemberStatus.PAID,
    rotationIndex: 1,
    hasReceivedPayout: true,
    onTimeCycles: 5,
    totalCycles: 5,
    joinedAt: Math.floor(Date.now() / 1000) - 86400 * 14,
  },
  {
    address: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
    displayName: "Kofi",
    status: MemberStatus.PAID,
    rotationIndex: 2,
    hasReceivedPayout: false,
    onTimeCycles: 4,
    totalCycles: 5,
    joinedAt: Math.floor(Date.now() / 1000) - 86400 * 12,
  },
  {
    address: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
    displayName: "Nneka",
    status: MemberStatus.PENDING,
    rotationIndex: 3,
    hasReceivedPayout: false,
    onTimeCycles: 5,
    totalCycles: 5,
    joinedAt: Math.floor(Date.now() / 1000) - 86400 * 10,
  },
  {
    address: "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
    displayName: "Yaw",
    status: MemberStatus.PAID,
    rotationIndex: 4,
    hasReceivedPayout: false,
    onTimeCycles: 3,
    totalCycles: 5,
    joinedAt: Math.floor(Date.now() / 1000) - 86400 * 10,
  },
];

const now = Math.floor(Date.now() / 1000);

export const DEMO_POOLS: Pool[] = [
  {
    address: "0x94099942864ea81ccf197e9d71ac53310b1468d8",
    displayName: "Family Susu Circle",
    organiser: DEMO_WALLET,
    status: PoolStatus.ACTIVE,
    contribution: 100_000000n, // 100 USDC
    depositAmount: 200_000000n,
    numMembers: 5,
    intervalSeconds: 604800,
    currentCycle: 2,
    cycleDeadline: now + 86400 * 3,
    currentPot: 300_000000n, // 300 USDC (3 of 5 paid)
    totalContributed: 1500_000000n,
    feeBps: 50,
    members: DEMO_MEMBERS,
    isPrivate: false,
    createdAt: now - 86400 * 30,
  },
  {
    address: "0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6",
    displayName: "Work Colleagues Pool",
    organiser: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    status: PoolStatus.FILLING,
    contribution: 50_000000n,
    depositAmount: 100_000000n,
    numMembers: 3,
    intervalSeconds: 1209600,
    currentCycle: 0,
    cycleDeadline: 0,
    currentPot: 0n,
    totalContributed: 0n,
    feeBps: 50,
    members: DEMO_MEMBERS.slice(0, 2),
    isPrivate: true,
    createdAt: now - 86400 * 3,
  },
  {
    address: "0x610178da211fef7d417bc0e6fed39f05609ad788",
    displayName: "Neighborhood Tontine",
    organiser: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
    status: PoolStatus.ACTIVE,
    contribution: 250_000000n,
    depositAmount: 500_000000n,
    numMembers: 4,
    intervalSeconds: 2592000,
    currentCycle: 3,
    cycleDeadline: now + 86400 * 12,
    currentPot: 750_000000n,
    totalContributed: 4500_000000n,
    feeBps: 50,
    members: DEMO_MEMBERS.slice(0, 4),
    isPrivate: false,
    createdAt: now - 86400 * 90,
  },
];

export const DEMO_BALANCE = {
  raw: 1250_000000n, // 1,250 USDC
  formatted: "1,250.00",
};

export function getDemoPool(address: string): Pool | null {
  return DEMO_POOLS.find(
    (p) => p.address.toLowerCase() === address.toLowerCase(),
  ) ?? null;
}
