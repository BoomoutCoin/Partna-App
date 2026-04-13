/**
 * Auth store — persisted to expo-secure-store so the session survives app
 * restarts without hitting the network on every cold start.
 *
 * Stores only:
 *   - `user`  the last-known profile (display_name, on_time_rate, is_pro)
 *   - `jwt`   the session token issued by POST /auth/wallet
 *
 * The JWT is short-lived (7d per config.JWT_EXPIRES_IN) and the app refreshes
 * it lazily via POST /auth/refresh when close to expiry.
 */

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import type { User, Address } from "@partna/types";

// ---------- SecureStore adapter ----------

const secureStorage: StateStorage = {
  getItem: async (name) => (await SecureStore.getItemAsync(name)) ?? null,
  setItem: async (name, value) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name) => {
    await SecureStore.deleteItemAsync(name);
  },
};

// ---------- Store ----------

interface AuthState {
  user: User | null;
  jwt: string | null;
  isHydrated: boolean;

  setSession: (session: { user: User; jwt: string }) => void;
  updateUser: (patch: Partial<User>) => void;
  clearSession: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      jwt: null,
      isHydrated: false,

      setSession: ({ user, jwt }) => set({ user, jwt }),
      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : state.user,
        })),
      clearSession: () => set({ user: null, jwt: null }),
      markHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "partna.auth",
      storage: createJSONStorage(() => secureStorage),
      // Only persist user + jwt, not the hydration flag.
      partialize: (state) => ({ user: state.user, jwt: state.jwt }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

// ---------- Convenience selectors ----------

export const useIsAuthenticated = (): boolean =>
  useAuthStore((s) => s.jwt !== null && s.user !== null);

export const useCurrentWallet = (): Address | null =>
  useAuthStore((s) => s.user?.walletAddress ?? null);
