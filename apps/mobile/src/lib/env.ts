/**
 * Runtime environment accessor.
 *
 * Pulls values from `app.config.ts.extra` via expo-constants. Import this
 * anywhere in the app instead of reaching for `Constants.expoConfig` directly.
 */

import Constants from "expo-constants";
import type { Address } from "@partna/types";

type Profile = "development" | "staging" | "production";

interface Extra {
  profile: Profile;
  apiUrl: string;
  graphUrl: string;
  chainId: number;
  privyAppId: string;
  wcProjectId: string;
  alchemyKey: string;
  poolFactoryAddress: string;
  usdcAddress: string;
  eas: { projectId: string };
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;


export const env = {
  profile: (extra.profile ?? "development") as Profile,
  apiUrl: extra.apiUrl ?? "http://localhost:3001",
  graphUrl: extra.graphUrl ?? "http://localhost:8000/subgraphs/name/partna",
  // In dev without an explicit chainId, default to Anvil (31337)
  chainId: extra.chainId ?? 31337,
  privyAppId: extra.privyAppId ?? "",
  wcProjectId: extra.wcProjectId ?? "",
  alchemyKey: extra.alchemyKey ?? "",
  poolFactoryAddress: (extra.poolFactoryAddress ?? "") as Address | "",
  usdcAddress: (extra.usdcAddress ?? "0x5FbDB2315678afecb367f032d93F642f64180aa3") as Address,
  easProjectId: extra.eas?.projectId ?? "",
} as const;

export const isProd = env.profile === "production";
export const isStaging = env.profile === "staging";
export const isDev = env.profile === "development";
