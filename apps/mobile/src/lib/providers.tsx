/**
 * Provider composition — ORDER MATTERS.
 *
 *   wagmi → React Query → Apollo → GestureHandler → SafeArea
 *
 * Web3Modal is initialized lazily on web only via dynamic import
 * to avoid Metro resolution failures on native.
 */

import { type ReactNode, useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { ApolloProvider } from "@apollo/client";

import { wagmiConfig } from "./wagmi";
import { queryClient } from "./queryClient";
import { apolloClient } from "./graphClient";
import { env } from "./env";

// Lazy Web3Modal init — dynamic import avoids Metro bundler crash
let web3ModalInitialized = false;
async function initWeb3Modal(): Promise<void> {
  if (web3ModalInitialized || Platform.OS !== "web" || !env.wcProjectId) return;
  web3ModalInitialized = true;
  try {
    const { createWeb3Modal } = await import("@web3modal/wagmi/react");
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
    // Web3Modal not available — wallet connect will work via wagmi connectors directly
  }
}

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => { void initWeb3Modal(); }, []);

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
