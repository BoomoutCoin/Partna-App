/**
 * BalanceCard — SELF-FETCHING organism. Dark gradient card showing USDC balance.
 * Calls useBalance internally. Drop on any screen and it just works.
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useBalance } from "../../hooks/useBalance";
import { useCurrentWallet } from "../../store/authStore";
import { Skeleton } from "../atoms/Skeleton";
import { colors, spacing, typography, radii } from "../../theme";

function BalanceCardInner() {
  const wallet = useCurrentWallet();
  const { formatted, isLoading } = useBalance(wallet);

  if (isLoading) return <BalanceCardSkeleton />;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>USDC Balance</Text>
      <Text style={styles.amount}>${formatted}</Text>
      <Text style={styles.network}>Base Network</Text>
    </View>
  );
}

function BalanceCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={100} height={14} borderRadius={4} />
      <Skeleton width={160} height={36} borderRadius={6} style={{ marginTop: spacing.s2 }} />
      <Skeleton width={80} height={12} borderRadius={4} style={{ marginTop: spacing.s2 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink.primary,
    borderRadius: radii.xl,
    padding: spacing.s6,
  },
  label: { ...typography.caption, color: colors.ink.subtle },
  amount: { ...typography.displayLarge, color: "#FFFFFF", marginTop: spacing.s1 },
  network: { ...typography.micro, color: colors.ink.muted, marginTop: spacing.s2 },
});

// Attach skeleton as a static property per spec rule.
BalanceCardInner.Skeleton = BalanceCardSkeleton;

export const BalanceCard = Object.assign(memo(BalanceCardInner), {
  Skeleton: BalanceCardSkeleton,
});
