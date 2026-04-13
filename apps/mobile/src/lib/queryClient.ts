/**
 * React Query client.
 *
 * Tuned for mobile: stale time = 30s (fresh data on pull-to-refresh),
 * cache time = 5min (keep hot when navigating between screens), retry once
 * on network failures.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false, // no window-focus event on native anyway
    },
    mutations: {
      retry: 0,
    },
  },
});
