/**
 * Home dashboard — dark theme, BalanceCard, PoolCards, actions.
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
import { colors, spacing } from "../../theme";

export default function Home() {
  const router = useRouter();
  const wallet = useCurrentWallet() ?? DEMO_WALLET;
  const { pools, isLoading } = useMyPools(wallet);
  const [refreshing, setRefreshing] = useState(false);

  const sorted = useMemo(() => [...pools].sort((a, b) => {
    const au = a.status === "ACTIVE" && a.cycleDeadline > 0 ? 1 : 0;
    const bu = b.status === "ACTIVE" && b.cycleDeadline > 0 ? 1 : 0;
    return au !== bu ? bu - au : a.cycleDeadline - b.cycleDeadline;
  }), [pools]);

  const onRefresh = useCallback(() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }, []);

  const renderItem = useCallback(({ item }: { item: Pool }) => (
    <View style={styles.cardWrap}><PoolCard pool={item} userAddress={wallet} /></View>
  ), [wallet]);

  const header = (
    <View style={styles.header}>
      <BalanceCard />
      <View style={styles.actions}>
        <View style={styles.actionBtn}>
          <Button label="Create pool" onPress={() => router.push("/pools/create")} size="md" />
        </View>
        <View style={styles.actionBtn}>
          <Button label="Join pool" onPress={() => router.push("/(modals)/join/demo")} variant="secondary" size="md" />
        </View>
      </View>
      {sorted.length > 0 && <Text style={styles.sectionTitle}>Your pools</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <FlashList
        data={sorted}
        renderItem={renderItem}
        estimatedItemSize={120}
        ListHeaderComponent={header}
        ListEmptyComponent={!isLoading ? <EmptyState emoji={"\u{1F91D}"} title="No pools yet" subtitle="Create a susu circle or join one." ctaLabel="Create pool" onCta={() => router.push("/pools/create")} /> : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.green} />}
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
  sectionTitle: { fontSize: 13, fontWeight: "600", color: colors.ink.muted, letterSpacing: 0.5, textTransform: "uppercase", marginTop: spacing.s2 },
  cardWrap: { marginBottom: spacing.s3 },
});
