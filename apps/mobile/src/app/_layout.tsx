/**
 * Root layout.
 *
 *   1. Wraps the whole app in AppProviders (Privy/wagmi/Query/Apollo/etc)
 *   2. Waits for SecureStore-backed auth state to hydrate before rendering
 *   3. Mounts the Expo Router Stack
 *
 * Deep link handling (notification taps, universal links) moves into a
 * dedicated `useDeepLink()` hook in Step 13.
 */

import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";

import { AppProviders } from "../lib/providers";
import { useAuthStore, useIsAuthenticated } from "../store/authStore";
import { colors } from "../theme";

// Keep splash up until SecureStore hydration finishes.
void SplashScreen.preventAutoHideAsync().catch(() => {
  /* already hidden */
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthed = useIsAuthenticated();

  useEffect(() => {
    if (!isHydrated) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthed && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (isAuthed && inAuthGroup) {
      router.replace("/(app)");
    }
  }, [isHydrated, isAuthed, segments, router]);

  useEffect(() => {
    if (isHydrated) void SplashScreen.hideAsync().catch(() => undefined);
  }, [isHydrated]);

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.ink.primary,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={colors.brand.green} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AppProviders>
      <AuthGate>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg.primary },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthGate>
    </AppProviders>
  );
}
