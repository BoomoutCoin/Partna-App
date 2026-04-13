/**
 * Provider composition — ORDER MATTERS per CLAUDE.md.
 *
 *   Privy (auth) → wagmi (on-chain) → React Query (server state)
 *        → Apollo (subgraph reads) → GestureHandlerRootView
 *
 * Privy is nested as a future-wrap: when `env.privyAppId` is empty (local
 * dev without a Privy app), we skip it so the tree still mounts. The real
 * Privy provider registers in Step 7+ once the account id is provisioned.
 */

import { type ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { ApolloProvider } from "@apollo/client";

import { wagmiConfig } from "./wagmi";
import { queryClient } from "./queryClient";
import { apolloClient } from "./graphClient";
import { env } from "./env";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const body = (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={apolloClient}>
          <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              {children}
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </ApolloProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );

  // Privy wrap is intentionally deferred — see the docblock above.
  if (!env.privyAppId) return body;

  // Actual Privy provider wiring lands when @privy-io/expo's provider API
  // stabilises for SDK 51. Until then, return the inner tree as-is.
  return body;
}
