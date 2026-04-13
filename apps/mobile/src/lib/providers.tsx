/**
 * Provider composition — ORDER MATTERS.
 *
 *   wagmi → React Query → Apollo → Web3Modal → GestureHandler → SafeArea
 *
 * Web3Modal provides the WalletConnect QR code modal on web.
 */

import { type ReactNode } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { ApolloProvider } from "@apollo/client";
import { createWeb3Modal } from "@web3modal/wagmi/react";

import { wagmiConfig } from "./wagmi";
import { queryClient } from "./queryClient";
import { apolloClient } from "./graphClient";
import { env } from "./env";

// Initialize Web3Modal (only on web — native uses WalletConnect's own modal)
if (Platform.OS === "web" && env.wcProjectId) {
  try {
    createWeb3Modal({
      wagmiConfig: wagmiConfig as Parameters<typeof createWeb3Modal>[0]["wagmiConfig"],
      projectId: env.wcProjectId,
      themeMode: "dark",
      themeVariables: {
        "--w3m-accent": "#16A34A",
        "--w3m-border-radius-master": "2px",
      },
    });
  } catch {
    // Web3Modal init can fail if already initialized — safe to ignore
  }
}

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
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
}
