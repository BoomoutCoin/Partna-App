/**
 * PaymentSummary — balance before / gas / balance after breakdown.
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../theme";

interface PaymentSummaryProps {
  balanceBefore: string;
  amount: string;
  estimatedGas: string;
  balanceAfter: string;
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

function PaymentSummaryInner({ balanceBefore, amount, estimatedGas, balanceAfter }: PaymentSummaryProps) {
  return (
    <View style={styles.root}>
      <Row label="Balance" value={`$${balanceBefore}`} />
      <Row label="Payment" value={`-$${amount}`} />
      <Row label="Gas (est.)" value={`~$${estimatedGas}`} />
      <View style={styles.divider} />
      <Row label="After" value={`$${balanceAfter}`} bold />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.bg.surface,
    borderRadius: 14,
    padding: spacing.s4,
    gap: spacing.s2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { ...typography.body, color: colors.ink.muted },
  value: { ...typography.body, color: colors.ink.primary },
  bold: { ...typography.bodyMedium, color: colors.ink.primary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.s1 },
});

export const PaymentSummary = memo(PaymentSummaryInner);
