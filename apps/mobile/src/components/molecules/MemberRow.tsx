/**
 * MemberRow — Avatar + name + truncated address + status badge.
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { PoolMember } from "@partna/types";
import { Avatar } from "../atoms/Avatar";
import { StatusBadge } from "../atoms/StatusBadge";
import { colors, spacing, typography, type StatusKey } from "../../theme";

interface MemberRowProps {
  member: PoolMember;
}

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function MemberRowInner({ member }: MemberRowProps) {
  return (
    <View style={styles.row}>
      <Avatar
        name={member.displayName}
        imageUrl={member.avatarUrl}
        address={member.address}
        size={36}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {member.displayName ?? truncate(member.address)}
        </Text>
        {member.displayName && (
          <Text style={styles.addr}>{truncate(member.address)}</Text>
        )}
      </View>
      <StatusBadge status={member.status as StatusKey} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.s3, paddingVertical: spacing.s2 },
  info: { flex: 1 },
  name: { ...typography.bodyMedium, color: colors.ink.primary },
  addr: { ...typography.micro, color: colors.ink.muted },
});

export const MemberRow = memo(MemberRowInner);
