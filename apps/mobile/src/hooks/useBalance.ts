/**
 * useBalance — USDC balance. Uses demo data on web / when no wallet connected.
 */

import { Platform } from "react-native";
import { useReadContract } from "wagmi";
import { formatUnits, type Address } from "viem";
import { ABIs } from "@partna/types";
import { currentAddresses } from "../lib/wagmi";
import { DEMO_BALANCE } from "../lib/demoData";

export function useBalance(walletAddress: Address | null) {
  const addrs = currentAddresses();

  const result = useReadContract({
    address: addrs.usdc,
    abi: ABIs.ERC20_ABI,
    functionName: "balanceOf",
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress && Platform.OS !== "web",
      refetchInterval: 10_000,
    },
  });

  // On web or when contract read isn't available, return demo balance
  if (Platform.OS === "web" || !result.data) {
    return {
      raw: DEMO_BALANCE.raw,
      formatted: DEMO_BALANCE.formatted,
      isLoading: false,
      refetch: result.refetch,
    };
  }

  const raw = result.data as bigint;
  return {
    raw,
    formatted: formatUnits(raw, 6),
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}
