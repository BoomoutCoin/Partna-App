/**
 * PoolFactory event handlers — handles PoolCreated to spin up SusuPool
 * data source templates.
 */

import { PoolCreated as PoolCreatedEvent } from "../../generated/PoolFactory/PoolFactory";
import { Pool, PoolCreatedEvent as PoolCreatedEntity } from "../../generated/schema";
import { SusuPool as SusuPoolTemplate } from "../../generated/templates";
import { BigInt } from "@graphprotocol/graph-ts";

export function handlePoolCreated(event: PoolCreatedEvent): void {
  const poolAddress = event.params.pool.toHexString();

  // Create Pool entity
  const pool = new Pool(poolAddress);
  pool.organiser = event.params.organiser;
  pool.status = "FILLING";
  pool.contribution = event.params.contribution;
  pool.numMembers = event.params.numMembers;
  pool.intervalSeconds = event.params.intervalSecs;
  pool.currentCycle = 0;
  pool.cycleDeadline = BigInt.zero();
  pool.currentPot = BigInt.zero();
  pool.totalContributed = BigInt.zero();
  pool.feeBps = 50;
  pool.createdAt = event.block.timestamp;
  pool.save();

  // Log event entity
  const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const created = new PoolCreatedEntity(id);
  created.pool = event.params.pool;
  created.organiser = event.params.organiser;
  created.contribution = event.params.contribution;
  created.numMembers = event.params.numMembers;
  created.intervalSecs = event.params.intervalSecs;
  created.blockNumber = event.block.number;
  created.blockTimestamp = event.block.timestamp;
  created.transactionHash = event.transaction.hash;
  created.save();

  // Start indexing this pool's events
  SusuPoolTemplate.create(event.params.pool);
}
