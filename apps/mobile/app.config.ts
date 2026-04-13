/**
 * Dynamic Expo config — runs in Node at build time to resolve per-environment
 * values (bundle IDs, API URLs, contract addresses) from process.env.
 *
 * APP_ENV controls the profile:
 *   - development (default) → local Fastify, Base Sepolia contracts
 *   - staging               → deployed staging API, Base Sepolia contracts
 *   - production            → prod API, Base mainnet contracts
 *
 * Values flow to the app via `Constants.expoConfig.extra` — see src/lib/env.ts.
 */

import type { ExpoConfig, ConfigContext } from "expo/config";

type Profile = "development" | "staging" | "production";

function getProfile(): Profile {
  const raw = (process.env.APP_ENV ?? "development").toLowerCase();
  if (raw === "production" || raw === "prod") return "production";
  if (raw === "staging" || raw === "stage") return "staging";
  return "development";
}

function bundleIdFor(profile: Profile): string {
  switch (profile) {
    case "production":
      return "app.partna.wallet";
    case "staging":
      return "app.partna.wallet.staging";
    default:
      return "app.partna.wallet.dev";
  }
}

function nameFor(profile: Profile): string {
  switch (profile) {
    case "production":
      return "PartNA Wallet";
    case "staging":
      return "PartNA (staging)";
    default:
      return "PartNA (dev)";
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = getProfile();
  const isProd = profile === "production";

  return {
    ...config,
    name: nameFor(profile),
    slug: "partna-wallet",
    scheme: "partna",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    // @ts-expect-error — newArchEnabled is supported from SDK 52+; pre-set to false for forward-compat
    newArchEnabled: false,
    assetBundlePatterns: ["**/*"],
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0F1423",
    },
    ios: {
      bundleIdentifier: bundleIdFor(profile),
      supportsTablet: false,
      associatedDomains: isProd ? ["applinks:partna.app"] : [],
      infoPlist: {
        NSFaceIDUsageDescription:
          "PartNA uses Face ID to authorise payments from your wallet.",
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: bundleIdFor(profile),
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0F1423",
      },
      intentFilters: isProd
        ? [
            {
              action: "VIEW",
              autoVerify: true,
              data: [{ scheme: "https", host: "partna.app" }],
              category: ["BROWSABLE", "DEFAULT"],
            },
          ]
        : [],
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-local-authentication",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#16A34A",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      profile,
      // Public Expo vars (safe to ship in binary): read in src/lib/env.ts
      apiUrl:
        profile === "production"
          ? "https://api.partna.app"
          : profile === "staging"
            ? "https://staging.api.partna.app"
            : "http://localhost:3001",
      graphUrl:
        profile === "production"
          ? "https://api.studio.thegraph.com/query/<id>/partna-wallet/v0"
          : "https://api.studio.thegraph.com/query/<id>/partna-wallet-sepolia/v0",
      chainId: isProd ? 8453 : 84532,
      privyAppId: process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? "",
      wcProjectId: process.env.EXPO_PUBLIC_WC_PROJECT_ID ?? "",
      alchemyKey: process.env.EXPO_PUBLIC_ALCHEMY_KEY ?? "",
      poolFactoryAddress: isProd
        ? (process.env.POOL_FACTORY_PROD ?? "")
        : (process.env.POOL_FACTORY_STAGING ?? ""),
      usdcAddress: isProd
        ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // Base mainnet
        : "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
      eas: {
        projectId: process.env.EAS_PROJECT_ID ?? "",
      },
    },
  };
};
