/**
 * wagmi v2 + viem config.
 *
 * Chains: Base mainnet + Base Sepolia + local Anvil (dev).
 * The ADDRESSES registry is the ONLY place contract addresses live; never
 * hardcode them in components.
 */

import { createConfig, http } from "wagmi";
import { base, baseSepolia, foundry } from "wagmi/chains";
import type { Address } from "@partna/types";

import { env } from "./env";

// ---------- Address registry ----------

interface ChainAddresses {
  usdc: Address;
  poolFactory: Address | null;
}

export const ADDRESSES: Record<number, ChainAddresses> = {
  [base.id]: {
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    poolFactory:
      env.chainId === base.id && env.poolFactoryAddress
        ? (env.poolFactoryAddress as Address)
        : null,
  },
  [baseSepolia.id]: {
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    poolFactory:
      env.chainId === baseSepolia.id && env.poolFactoryAddress
        ? (env.poolFactoryAddress as Address)
        : null,
  },
  // Local Anvil testnet — addresses from DeployLocal.s.sol
  [foundry.id]: {
    usdc: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    poolFactory: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  },
};

/** Resolve the current chain's addresses based on the APP_ENV profile. */
export function currentAddresses(): ChainAddresses {
  // In dev, prefer Anvil (31337) if available
  const anvilAddrs = ADDRESSES[foundry.id];
  if (env.profile === "development" && anvilAddrs) {
    return anvilAddrs;
  }
  const a = ADDRESSES[env.chainId];
  if (!a) throw new Error(`[wagmi] No addresses for chainId ${env.chainId}`);
  return a;
}

// ---------- wagmi config ----------

const alchemyRpc = (subdomain: string): string =>
  env.alchemyKey
    ? `https://${subdomain}.g.alchemy.com/v2/${env.alchemyKey}`
    : subdomain === "base-sepolia"
      ? "https://sepolia.base.org"
      : "https://mainnet.base.org";

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia, foundry],
  transports: {
    [base.id]: http(alchemyRpc("base-mainnet")),
    [baseSepolia.id]: http(alchemyRpc("base-sepolia")),
    [foundry.id]: http("http://127.0.0.1:8545"),
  },
});

export type ChainId = typeof base.id | typeof baseSepolia.id | typeof foundry.id;
