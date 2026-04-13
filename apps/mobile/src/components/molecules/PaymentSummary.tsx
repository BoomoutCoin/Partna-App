/**
 * PaymentSummary — dark-mode breakdown card.
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme";

interface PaymentSummaryProps {
  balanceBefore: string;
  amount: string;
  estimatedGas: string;
  balanceAfter: string;
}

function Row({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, bold && styles.boldLabel]}>{label}</Text>
      <Text style={[styles.value, bold && styles.boldValue, green && styles.greenValue]}>{value}</Text>
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
      <Row label="After payment" value={`$${balanceAfter}`} bold green />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.bg.surface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 13, color: "rgba(255,255,255,0.45)" },
  value: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.7)", fontFamily: "monospace" },
  boldLabel: { fontWeight: "600", color: colors.ink.primary },
  boldValue: { fontWeight: "700", color: colors.ink.primary },
  greenValue: { color: colors.brand.greenLight },
  divider: { height: 1, backgroundColor: colors.border },
});

export const PaymentSummary = memo(PaymentSummaryInner);
