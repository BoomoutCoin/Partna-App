/**
 * Address helpers. The canonical representation of a wallet address
 * everywhere in the API is **lowercase** (matches the Postgres domain
 * constraint `^0x[0-9a-f]{40}$`).
 */

import { isAddress, type Address } from "viem";

export function normalizeAddress(input: string): Address {
  if (!isAddress(input)) {
    throw new Error("Invalid EVM address");
  }
  return input.toLowerCase() as Address;
}

export function isValidAddress(input: string): input is Address {
  return isAddress(input);
}
