/**
 * Activity screen — polished dark-mode, segmented tabs placeholder.
 */

import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/molecules/EmptyState";
import { colors, spacing } from "../../theme";

type Tab = "all" | "payments" | "payouts";

export default function Activity() {
  const [tab, setTab] = useState<Tab>("all");

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <View style={styles.tabs}>
          {(["all", "payments", "payouts"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "all" ? "All" : t === "payments" ? "Payments" : "Payouts"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <EmptyState
        emoji={tab === "payouts" ? "\u{1F4B0}" : tab === "payments" ? "\u{1F4B3}" : "\u{1F4CB}"}
        title={`No ${tab === "all" ? "activity" : tab} yet`}
        subtitle="Your contributions, payouts, and notifications will appear here as you use your pools."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  header: { padding: spacing.s6, paddingBottom: 0, gap: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.5 },
  tabs: { flexDirection: "row", gap: 6 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.brand.green, borderColor: colors.brand.green },
  tabText: { fontSize: 12, fontWeight: "600", color: colors.ink.muted },
  tabTextActive: { color: "#FFFFFF" },
});
