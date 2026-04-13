/**
 * StatusBadge — dark theme with dot indicators.
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, type StatusKey } from "../../theme";

interface StatusBadgeProps { status: StatusKey; }

const labelMap: Record<StatusKey, string> = {
  paid: "Paid", pending: "Pending", due: "Due", slashed: "Slashed",
  receiving: "Receiving", active: "Active", filling: "Filling", completed: "Completed",
};

function StatusBadgeInner({ status }: StatusBadgeProps) {
  const { bg, text, accent } = colors.status[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text style={[styles.label, { color: text }]}>{labelMap[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  label: { ...typography.micro, textTransform: "uppercase" },
});

export const StatusBadge = memo(StatusBadgeInner);
