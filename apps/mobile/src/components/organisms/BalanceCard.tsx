/**
 * BalanceCard — SELF-FETCHING. Dark gradient card with green accent.
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useBalance } from "../../hooks/useBalance";
import { useCurrentWallet } from "../../store/authStore";
import { Skeleton } from "../atoms/Skeleton";
import { DEMO_WALLET } from "../../lib/demoData";
import { colors, spacing } from "../../theme";

function BalanceCardInner() {
  const wallet = useCurrentWallet() ?? DEMO_WALLET;
  const { formatted, isLoading } = useBalance(wallet);

  if (isLoading) return <BalanceCardSkeleton />;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>USDC BALANCE</Text>
      <Text style={styles.amount}>${formatted}</Text>
      <View style={styles.pill}>
        <View style={styles.pillDot} />
        <Text style={styles.pillText}>Base Network</Text>
      </View>
    </View>
  );
}

function BalanceCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={100} height={12} />
      <Skeleton width={180} height={40} style={{ marginTop: spacing.s2 }} />
      <Skeleton width={90} height={20} borderRadius={10} style={{ marginTop: spacing.s3 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.bg.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 11, fontWeight: "500", color: colors.ink.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  amount: { fontSize: 36, fontWeight: "800", color: "#FFFFFF", letterSpacing: -1.5 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.bg.glass, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, marginTop: 12, alignSelf: "flex-start" },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brand.green },
  pillText: { fontSize: 10, color: colors.ink.muted, fontFamily: "monospace" },
});

export const BalanceCard = Object.assign(memo(BalanceCardInner), { Skeleton: BalanceCardSkeleton });
