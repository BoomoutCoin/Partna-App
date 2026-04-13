/**
 * MemberList — SELF-FETCHING organism. FlashList of MemberRow.
 */

import { memo, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import type { Address, PoolMember } from "@partna/types";

import { usePool } from "../../hooks/usePool";
import { MemberRow } from "../molecules/MemberRow";
import { Skeleton } from "../atoms/Skeleton";
import { colors, spacing, typography } from "../../theme";

interface MemberListProps {
  poolId: Address;
}

function MemberListInner({ poolId }: MemberListProps) {
  const { pool, isLoading } = usePool(poolId);

  const renderItem = useCallback(
    ({ item }: { item: PoolMember }) => <MemberRow member={item} />,
    [],
  );

  if (isLoading || !pool) return <MemberListSkeleton />;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Members ({pool.members.length})</Text>
      <FlashList
        data={pool.members}
        renderItem={renderItem}
        estimatedItemSize={52}
        keyExtractor={(m) => m.address}
        scrollEnabled={false}
      />
    </View>
  );
}

function MemberListSkeleton() {
  return (
    <View style={styles.root}>
      <Skeleton width={120} height={20} />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} width="100%" height={44} style={{ marginTop: spacing.s2 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.s3 },
  title: { ...typography.h3, color: colors.ink.primary },
});

export const MemberList = Object.assign(memo(MemberListInner), { Skeleton: MemberListSkeleton });
