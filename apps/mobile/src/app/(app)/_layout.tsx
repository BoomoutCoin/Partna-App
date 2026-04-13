/**
 * Authenticated tab layout — 4 tabs per spec: Home, Pools, Activity, Profile.
 */

import { Tabs } from "expo-router";
import { colors, typography } from "../../theme";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.green,
        tabBarInactiveTintColor: colors.ink.muted,
        tabBarLabelStyle: { ...typography.micro, marginBottom: 2 },
        tabBarStyle: {
          backgroundColor: colors.bg.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 4,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="activity" options={{ title: "Activity" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      {/* Pool detail + create are stack screens, not tabs. Hide them from the tab bar. */}
      <Tabs.Screen name="pools/[poolId]" options={{ href: null }} />
      <Tabs.Screen name="pools/create" options={{ href: null }} />
    </Tabs>
  );
}
