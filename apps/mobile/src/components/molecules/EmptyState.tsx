/**
 * EmptyState — emoji icon + title + subtitle + optional CTA button.
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "../atoms/Button";
import { colors, spacing, typography } from "../../theme";

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
}

function EmptyStateInner({ emoji, title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {ctaLabel && onCta && (
        <View style={styles.cta}>
          <Button label={ctaLabel} onPress={onCta} size="md" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", paddingVertical: spacing.s12, paddingHorizontal: spacing.s6 },
  emoji: { fontSize: 48, marginBottom: spacing.s4 },
  title: { ...typography.h2, color: colors.ink.primary, textAlign: "center" },
  subtitle: {
    ...typography.body,
    color: colors.ink.muted,
    textAlign: "center",
    marginTop: spacing.s2,
  },
  cta: { marginTop: spacing.s6 },
});

export const EmptyState = memo(EmptyStateInner);
