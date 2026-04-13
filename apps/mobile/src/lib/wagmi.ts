/**
 * wagmi v2 + viem config with WalletConnect connector.
 */

import { createConfig, http } from "wagmi";
import { base, baseSepolia, foundry } from "wagmi/chains";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";
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
  [foundry.id]: {
    usdc: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    poolFactory: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  },
};

export function currentAddresses(): ChainAddresses {
  const anvilAddrs = ADDRESSES[foundry.id];
  if (env.profile === "development" && anvilAddrs) return anvilAddrs;
  const a = ADDRESSES[env.chainId];
  if (!a) throw new Error(`[wagmi] No addresses for chainId ${env.chainId}`);
  return a;
}

// ---------- RPC ----------

const alchemyRpc = (subdomain: string): string =>
  env.alchemyKey
    ? `https://${subdomain}.g.alchemy.com/v2/${env.alchemyKey}`
    : subdomain === "base-sepolia"
      ? "https://sepolia.base.org"
      : "https://mainnet.base.org";

// ---------- Connectors ----------

const connectors = env.wcProjectId
  ? [
      walletConnect({
        projectId: env.wcProjectId,
        metadata: {
          name: "PartNA Wallet",
          description: "Rotating savings circles on Base",
          url: "https://partna.app",
          icons: ["https://dist-dusky-omega.vercel.app/favicon.ico"],
        },
        showQrModal: true,
      }),
      injected({ shimDisconnect: true }),
      coinbaseWallet({
        appName: "PartNA Wallet",
        appLogoUrl: "https://dist-dusky-omega.vercel.app/favicon.ico",
      }),
    ]
  : [injected({ shimDisconnect: true })];

// ---------- Config ----------

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia, foundry],
  connectors,
  transports: {
    [base.id]: http(alchemyRpc("base-mainnet")),
    [baseSepolia.id]: http(alchemyRpc("base-sepolia")),
    [foundry.id]: http("http://127.0.0.1:8545"),
  },
});

export type ChainId = typeof base.id | typeof baseSepolia.id | typeof foundry.id;
