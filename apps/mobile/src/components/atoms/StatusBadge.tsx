/**
 * StatusBadge — 8 states: paid/pending/due/slashed/receiving/active/filling/completed.
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography, type StatusKey } from "../../theme";

interface StatusBadgeProps {
  status: StatusKey;
}

const labelMap: Record<StatusKey, string> = {
  paid: "Paid",
  pending: "Pending",
  due: "Due",
  slashed: "Slashed",
  receiving: "Receiving",
  active: "Active",
  filling: "Filling",
  completed: "Completed",
};

function StatusBadgeInner({ status }: StatusBadgeProps) {
  const { bg, text } = colors.status[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{labelMap[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.s2,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  label: {
    ...typography.micro,
    textTransform: "uppercase",
  },
});

export const StatusBadge = memo(StatusBadgeInner);
