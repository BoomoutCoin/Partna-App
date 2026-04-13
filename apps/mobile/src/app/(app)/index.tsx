/**
 * Home dashboard — FlashList of PoolCards, BalanceCard header, pull-to-refresh.
 */

import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import type { Pool } from "@partna/types";

import { useMyPools } from "../../hooks/usePool";
import { useCurrentWallet } from "../../store/authStore";
import { BalanceCard } from "../../components/organisms/BalanceCard";
import { PoolCard } from "../../components/molecules/PoolCard";
import { EmptyState } from "../../components/molecules/EmptyState";
import { Button } from "../../components/atoms/Button";
import { DEMO_WALLET } from "../../lib/demoData";
import { colors, spacing, typography } from "../../theme";

export default function Home() {
  const router = useRouter();
  const wallet = useCurrentWallet() ?? DEMO_WALLET;
  const { pools, isLoading } = useMyPools(wallet);
  const [refreshing, setRefreshing] = useState(false);

  const sorted = useMemo(() => {
    return [...pools].sort((a, b) => {
      const aUrgent = a.status === "ACTIVE" && a.cycleDeadline > 0 ? 1 : 0;
      const bUrgent = b.status === "ACTIVE" && b.cycleDeadline > 0 ? 1 : 0;
      if (aUrgent !== bUrgent) return bUrgent - aUrgent;
      return a.cycleDeadline - b.cycleDeadline;
    });
  }, [pools]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Pool }) => (
      <View style={styles.cardWrap}>
        <PoolCard pool={item} userAddress={wallet} />
      </View>
    ),
    [wallet],
  );

  const header = (
    <View style={styles.header}>
      <BalanceCard />
      <View style={styles.actions}>
        <View style={styles.actionBtn}>
          <Button
            label="Create pool"
            onPress={() => router.push("/pools/create")}
            size="md"
          />
        </View>
        <View style={styles.actionBtn}>
          <Button
            label="Join pool"
            onPress={() => router.push("/(modals)/join/demo")}
            variant="secondary"
            size="md"
          />
        </View>
      </View>
      {sorted.length > 0 && (
        <Text style={styles.sectionTitle}>Your pools</Text>
      )}
    </View>
  );

  const empty = (
    <EmptyState
      emoji={"\u{1F91D}"}
      title="No pools yet"
      subtitle="Create a susu circle or join one with an invite link."
      ctaLabel="Create your first pool"
      onCta={() => router.push("/pools/create")}
    />
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <FlashList
        data={sorted}
        renderItem={renderItem}
        estimatedItemSize={120}
        ListHeaderComponent={header}
        ListEmptyComponent={!isLoading ? empty : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        keyExtractor={(item) => item.address}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  list: { paddingHorizontal: spacing.s4, paddingBottom: spacing.s8 },
  header: { gap: spacing.s4, paddingTop: spacing.s4, paddingBottom: spacing.s2 },
  actions: { flexDirection: "row", gap: spacing.s3 },
  actionBtn: { flex: 1 },
  sectionTitle: { ...typography.h3, color: colors.ink.primary, marginTop: spacing.s2 },
  cardWrap: { marginBottom: spacing.s3 },
});
