/**
 * Authenticated tab layout.
 *
 * Four tabs per spec: Home, Pools, Activity, Profile. Pools + Activity +
 * Profile are placeholder screens until their real implementations land in
 * Steps 8 and later.
 */

import { Tabs } from "expo-router";
import { colors } from "../../theme";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.green,
        tabBarInactiveTintColor: colors.ink.muted,
        tabBarStyle: {
          backgroundColor: colors.bg.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
    </Tabs>
  );
}
