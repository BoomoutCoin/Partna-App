/**
 * AmountDisplay — large currency display, variant=payout is green.
 */

import { memo } from "react";
import { Text, StyleSheet } from "react-native";
import { colors, typography } from "../../theme";

interface AmountDisplayProps {
  amount: string;
  variant?: "default" | "payout";
  size?: "md" | "lg";
}

function AmountDisplayInner({ amount, variant = "default", size = "lg" }: AmountDisplayProps) {
  const color = variant === "payout" ? colors.brand.green : colors.ink.primary;
  const textStyle = size === "lg" ? styles.lg : styles.md;
  return <Text style={[textStyle, { color }]}>${amount}</Text>;
}

const styles = StyleSheet.create({
  lg: { ...typography.displayLarge },
  md: { ...typography.h1 },
});

export const AmountDisplay = memo(AmountDisplayInner);
