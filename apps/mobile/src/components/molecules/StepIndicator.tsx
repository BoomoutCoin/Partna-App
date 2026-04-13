/**
 * StepIndicator — 4-step wizard dots with connecting lines.
 */

import { memo } from "react";
import { View, StyleSheet } from "react-native";
import { colors, spacing } from "../../theme";

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

function StepIndicatorInner({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <View style={styles.root}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const isActive = i + 1 <= currentStep;
        const isCurrent = i + 1 === currentStep;
        return (
          <View key={i} style={styles.segment}>
            <View
              style={[
                styles.dot,
                isActive && styles.dotActive,
                isCurrent && styles.dotCurrent,
              ]}
            />
            {i < totalSteps - 1 && (
              <View style={[styles.line, isActive && styles.lineActive]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center" },
  segment: { flexDirection: "row", alignItems: "center" },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.bg.elevated,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.brand.green,
    borderColor: colors.brand.green,
  },
  dotCurrent: {
    borderColor: colors.brand.green,
    backgroundColor: colors.bg.surface,
  },
  line: {
    width: 32,
    height: 2,
    backgroundColor: colors.bg.elevated,
    marginHorizontal: spacing.s1,
  },
  lineActive: {
    backgroundColor: colors.brand.green,
  },
});

export const StepIndicator = memo(StepIndicatorInner);
