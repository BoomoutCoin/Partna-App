/**
 * PoolCard — dark card with left accent bar, clean layout.
 */

import { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { formatUnits, type Address } from "viem";
import type { Pool } from "@partna/types";
import { StatusBadge } from "../atoms/StatusBadge";
import { CycleRing } from "../atoms/CycleRing";
import { colors, spacing, type StatusKey } from "../../theme";

interface PoolCardProps { pool: Pool; userAddress: Address; }

function PoolCardInner({ pool, userAddress }: PoolCardProps) {
  const router = useRouter();
  const myMember = pool.members.find((m) => m.address.toLowerCase() === userAddress.toLowerCase());
  const badgeStatus = (myMember?.status ?? "active") as StatusKey;
  const progress = pool.numMembers > 0 ? pool.currentCycle / pool.numMembers : 0;

  const accentColor = badgeStatus === "due" ? colors.semantic.warning
    : badgeStatus === "paid" ? colors.brand.green
    : badgeStatus === "receiving" ? "#7C3AED"
    : colors.borderLight;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/pools/${pool.address}`)}
    >
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={styles.titleCol}>
            <Text style={styles.name} numberOfLines={1}>{pool.displayName}</Text>
            <Text style={styles.meta}>{formatUnits(pool.contribution, 6)} USDC / cycle</Text>
          </View>
          <CycleRing progress={progress} size={44} strokeWidth={3} color={colors.brand.greenLight} trackColor={colors.bg.elevated} />
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.cycle}>Cycle {pool.currentCycle}/{pool.numMembers}</Text>
          <StatusBadge status={badgeStatus} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.bg.surface, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.border, flexDirection: "row" },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  accent: { width: 3, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  inner: { flex: 1, padding: 14, gap: spacing.s2 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titleCol: { flex: 1, marginRight: spacing.s3 },
  name: { fontSize: 14, fontWeight: "700", color: colors.ink.primary },
  meta: { fontSize: 11, color: colors.ink.muted, marginTop: 2 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cycle: { fontSize: 11, color: colors.ink.muted },
});

export const PoolCard = memo(PoolCardInner);
