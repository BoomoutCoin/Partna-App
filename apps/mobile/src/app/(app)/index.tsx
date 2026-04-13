/**
 * Home dashboard.
 *
 * FlashList of PoolCards sorted: urgent-unpaid first, then by deadline.
 * ListHeaderComponent: BalanceCard + action row.
 * Pull to refresh. EmptyState when no pools.
 */

import { useCallback, useMemo } from "react";
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
import { colors, spacing, typography } from "../../theme";

export default function Home() {
  const router = useRouter();
  const wallet = useCurrentWallet();
  const { pools, isLoading } = useMyPools(wallet);

  const sorted = useMemo(() => {
    return [...pools].sort((a, b) => {
      // Urgent (unpaid, closest deadline) first
      const aUrgent = a.status === "ACTIVE" && a.cycleDeadline > 0 ? 1 : 0;
      const bUrgent = b.status === "ACTIVE" && b.cycleDeadline > 0 ? 1 : 0;
      if (aUrgent !== bUrgent) return bUrgent - aUrgent;
      return a.cycleDeadline - b.cycleDeadline;
    });
  }, [pools]);

  const renderItem = useCallback(
    ({ item }: { item: Pool }) => (
      <View style={styles.cardWrap}>
        <PoolCard pool={item} userAddress={wallet!} />
      </View>
    ),
    [wallet],
  );

  const header = (
    <View style={styles.header}>
      <BalanceCard />
      <View style={styles.actions}>
        <Button
          label="Create pool"
          onPress={() => router.push("/pools/create")}
          size="md"
        />
        <Button
          label="Join pool"
          onPress={() => {/* TODO: invite scanner */}}
          variant="secondary"
          size="md"
        />
      </View>
      {sorted.length > 0 && (
        <Text style={styles.sectionTitle}>Your pools</Text>
      )}
    </View>
  );

  const empty = (
    <EmptyState
      emoji="\u{1F91D}"
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
          <RefreshControl refreshing={isLoading} onRefresh={() => {}} />
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
  sectionTitle: { ...typography.h3, color: colors.ink.primary, marginTop: spacing.s2 },
  cardWrap: { marginBottom: spacing.s3 },
});
