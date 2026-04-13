/**
 * AmountDisplay — large currency display, green for payout variant.
 */

import { memo } from "react";
import { Text, StyleSheet } from "react-native";
import { colors } from "../../theme";

interface AmountDisplayProps {
  amount: string;
  variant?: "default" | "payout";
  size?: "md" | "lg";
}

function AmountDisplayInner({ amount, variant = "default", size = "lg" }: AmountDisplayProps) {
  const color = variant === "payout" ? colors.brand.greenLight : "#FFFFFF";
  return (
    <Text style={[size === "lg" ? styles.lg : styles.md, { color }]}>
      ${amount}
    </Text>
  );
}

const styles = StyleSheet.create({
  lg: { fontSize: 48, fontWeight: "800", letterSpacing: -2, lineHeight: 52 },
  md: { fontSize: 32, fontWeight: "800", letterSpacing: -1.2 },
});

export const AmountDisplay = memo(AmountDisplayInner);
