/**
 * Tab layout — dark theme, 3 tabs.
 */

import { Tabs } from "expo-router";
import { colors } from "../../theme";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.greenLight,
        tabBarInactiveTintColor: colors.ink.subtle,
        tabBarLabelStyle: { fontSize: 9, fontWeight: "600", marginBottom: 2 },
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
      <Tabs.Screen name="pools/[poolId]" options={{ href: null }} />
      <Tabs.Screen name="pools/create" options={{ href: null }} />
    </Tabs>
  );
}
