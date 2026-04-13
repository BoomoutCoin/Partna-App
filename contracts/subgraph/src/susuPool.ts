/**
 * SusuPool event handlers — updates Pool + Member entities from on-chain events.
 */

import {
  MemberJoined,
  PoolActivated,
  RotationSet,
  ContributionReceived,
  PayoutExecuted,
  MemberSlashed,
  PoolCompleted,
  DepositReturned,
} from "../../generated/templates/SusuPool/SusuPool";
import { Pool, Member } from "../../generated/schema";
import { BigInt, Address } from "@graphprotocol/graph-ts";

function getMemberId(pool: Address, member: Address): string {
  return pool.toHexString() + "-" + member.toHexString();
}

export function handleMemberJoined(event: MemberJoined): void {
  const poolId = event.address.toHexString();
  const memberId = getMemberId(event.address, event.params.member);

  const member = new Member(memberId);
  member.pool = poolId;
  member.address = event.params.member;
  member.rotationIndex = 0;
  member.hasReceivedPayout = false;
  member.slashed = false;
  member.paidThisCycle = false;
  member.onTimeCycles = 0;
  member.totalCycles = 0;
  member.joinedAt = event.block.timestamp;
  member.save();
}

export function handlePoolActivated(event: PoolActivated): void {
  const pool = Pool.load(event.address.toHexString());
  if (!pool) return;

  pool.status = "ACTIVE";
  pool.currentCycle = 1;
  pool.cycleDeadline = event.params.startTime.plus(pool.intervalSeconds);
  pool.save();
}

export function handleRotationSet(event: RotationSet): void {
  const poolAddress = event.address;
  const order = event.params.order;

  for (let i = 0; i < order.length; i++) {
    const memberId = getMemberId(poolAddress, order[i]);
    const member = Member.load(memberId);
    if (member) {
      member.rotationIndex = i;
      member.save();
    }
  }
}

export function handleContributionReceived(event: ContributionReceived): void {
  const poolId = event.address.toHexString();
  const memberId = getMemberId(event.address, event.params.member);

  const pool = Pool.load(poolId);
  if (pool) {
    pool.currentPot = pool.currentPot.plus(event.params.amount);
    pool.totalContributed = pool.totalContributed.plus(event.params.amount);
    pool.save();
  }

  const member = Member.load(memberId);
  if (member) {
    member.paidThisCycle = true;
    member.onTimeCycles = member.onTimeCycles + 1;
    member.totalCycles = member.totalCycles + 1;
    member.save();
  }
}

export function handlePayoutExecuted(event: PayoutExecuted): void {
  const poolId = event.address.toHexString();
  const memberId = getMemberId(event.address, event.params.recipient);

  const pool = Pool.load(poolId);
  if (pool) {
    pool.currentPot = BigInt.zero();
    // Reset paidThisCycle for all pool members (next cycle)
    pool.currentCycle = pool.currentCycle + 1;
    pool.cycleDeadline = event.block.timestamp.plus(pool.intervalSeconds);
    pool.save();
  }

  const member = Member.load(memberId);
  if (member) {
    member.hasReceivedPayout = true;
    member.paidThisCycle = false;
    member.save();
  }
}

export function handleMemberSlashed(event: MemberSlashed): void {
  const memberId = getMemberId(event.address, event.params.member);
  const member = Member.load(memberId);
  if (member) {
    member.slashed = true;
    member.totalCycles = member.totalCycles + 1;
    member.save();
  }
}

export function handlePoolCompleted(event: PoolCompleted): void {
  const pool = Pool.load(event.address.toHexString());
  if (pool) {
    pool.status = "COMPLETED";
    pool.save();
  }
}

export function handleDepositReturned(_event: DepositReturned): void {
  // Deposit return is terminal — no entity update needed beyond pool completion.
  // Could track per-member deposit status if we add a field later.
}
