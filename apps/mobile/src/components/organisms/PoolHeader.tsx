/**
 * PoolHeader — SELF-FETCHING. Pot card + cycle ring + deadline.
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { formatUnits } from "viem";
import type { Address } from "@partna/types";

import { usePool } from "../../hooks/usePool";
import { CycleRing } from "../atoms/CycleRing";
import { StatusBadge } from "../atoms/StatusBadge";
import { Skeleton } from "../atoms/Skeleton";
import { colors, spacing, typography, radii, type StatusKey } from "../../theme";

interface PoolHeaderProps {
  poolId: Address;
}

function PoolHeaderInner({ poolId }: PoolHeaderProps) {
  const { pool, isLoading } = usePool(poolId);

  if (isLoading || !pool) return <PoolHeaderSkeleton />;

  const progress = pool.numMembers > 0 ? pool.currentCycle / pool.numMembers : 0;
  const deadline = pool.cycleDeadline
    ? new Date(pool.cycleDeadline * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <Text style={styles.name}>{pool.displayName}</Text>
          <StatusBadge status={pool.status.toLowerCase() as StatusKey} />
        </View>
        <CycleRing progress={progress} size={56} strokeWidth={4} />
      </View>

      <View style={styles.potRow}>
        <Text style={styles.potLabel}>Current pot</Text>
        <Text style={styles.potValue}>
          ${formatUnits(pool.currentPot, 6)} USDC
        </Text>
      </View>

      <View style={styles.metaRow}>
        <MetaItem label="Contribution" value={`$${formatUnits(pool.contribution, 6)}`} />
        <MetaItem label="Members" value={`${pool.members.length}/${pool.numMembers}`} />
        <MetaItem label="Deadline" value={deadline} />
      </View>
    </View>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function PoolHeaderSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="60%" height={24} />
      <Skeleton width="40%" height={36} style={{ marginTop: spacing.s3 }} />
      <Skeleton width="100%" height={48} style={{ marginTop: spacing.s3 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing.s6,
    gap: spacing.s4,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  titleCol: { flex: 1, gap: spacing.s2 },
  name: { ...typography.h2, color: colors.ink.primary },
  potRow: { gap: spacing.s1 },
  potLabel: { ...typography.caption, color: colors.ink.muted },
  potValue: { ...typography.h1, color: colors.brand.green },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaItem: { alignItems: "center" },
  metaLabel: { ...typography.micro, color: colors.ink.muted },
  metaValue: { ...typography.bodyMedium, color: colors.ink.primary },
});

export const PoolHeader = Object.assign(memo(PoolHeaderInner), { Skeleton: PoolHeaderSkeleton });
