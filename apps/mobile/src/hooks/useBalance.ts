/**
 * useBalance — USDC balance via wagmi useReadContract, 10s refresh.
 */

import { useReadContract } from "wagmi";
import { formatUnits, type Address } from "viem";
import { ABIs } from "@partna/types";
import { currentAddresses } from "../lib/wagmi";

export function useBalance(walletAddress: Address | null) {
  const addrs = currentAddresses();

  const result = useReadContract({
    address: addrs.usdc,
    abi: ABIs.ERC20_ABI,
    functionName: "balanceOf",
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress,
      refetchInterval: 10_000,
    },
  });

  const raw = result.data as bigint | undefined;
  return {
    raw: raw ?? 0n,
    formatted: raw ? formatUnits(raw, 6) : "0.00",
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}
