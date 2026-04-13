/**
 * MemberRow — dark-mode, clean spacing, monospace address.
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { PoolMember } from "@partna/types";
import { Avatar } from "../atoms/Avatar";
import { StatusBadge } from "../atoms/StatusBadge";
import { colors, type StatusKey } from "../../theme";

interface MemberRowProps { member: PoolMember; }

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}\u2026${addr.slice(-4)}`;
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
        <Text style={styles.addr}>{truncate(member.address)}</Text>
      </View>
      <StatusBadge status={member.status as StatusKey} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.bg.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 13, fontWeight: "600", color: colors.ink.primary },
  addr: { fontSize: 10, color: colors.ink.subtle, fontFamily: "monospace", marginTop: 1 },
});

export const MemberRow = memo(MemberRowInner);
