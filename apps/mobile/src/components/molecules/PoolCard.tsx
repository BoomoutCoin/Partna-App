/**
 * PoolCard — derives accent colour + badge from pool data + userAddress.
 * Prop-driven molecule. No fetching.
 */

import { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { formatUnits, type Address } from "viem";
import type { Pool, MemberStatus } from "@partna/types";

import { StatusBadge } from "../atoms/StatusBadge";
import { CycleRing } from "../atoms/CycleRing";
import { colors, spacing, typography, radii } from "../../theme";

interface PoolCardProps {
  pool: Pool;
  userAddress: Address;
}

function PoolCardInner({ pool, userAddress }: PoolCardProps) {
  const router = useRouter();
  const myMember = pool.members.find(
    (m) => m.address.toLowerCase() === userAddress.toLowerCase(),
  );
  const badgeStatus = myMember?.status ?? ("active" as MemberStatus);
  const progress = pool.numMembers > 0 ? pool.currentCycle / pool.numMembers : 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/pools/${pool.address}`)}
    >
      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <Text style={styles.name} numberOfLines={1}>
            {pool.displayName}
          </Text>
          <Text style={styles.amount}>
            {formatUnits(pool.contribution, 6)} USDC / cycle
          </Text>
        </View>
        <CycleRing progress={progress} size={44} strokeWidth={3} />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.meta}>
          Cycle {pool.currentCycle}/{pool.numMembers}
        </Text>
        <StatusBadge status={badgeStatus} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    padding: spacing.s4,
    gap: spacing.s3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.92 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titleCol: { flex: 1, marginRight: spacing.s3 },
  name: { ...typography.h3, color: colors.ink.primary },
  amount: { ...typography.caption, color: colors.ink.muted, marginTop: 2 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meta: { ...typography.caption, color: colors.ink.muted },
});

export const PoolCard = memo(PoolCardInner);
