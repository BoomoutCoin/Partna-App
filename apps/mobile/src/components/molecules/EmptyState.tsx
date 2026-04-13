/**
 * EmptyState — refined dark-mode version with subtle glow.
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "../atoms/Button";
import { colors, spacing } from "../../theme";

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  ctaLabel?: string | undefined;
  onCta?: (() => void) | undefined;
}

function EmptyStateInner({ emoji, title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <View style={styles.iconWrap}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
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
  root: { alignItems: "center", paddingVertical: 48, paddingHorizontal: spacing.s6 },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emoji: { fontSize: 36 },
  title: { fontSize: 18, fontWeight: "700", color: colors.ink.primary, textAlign: "center" },
  subtitle: {
    fontSize: 14,
    color: colors.ink.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 260,
  },
  cta: { marginTop: 24 },
});

export const EmptyState = memo(EmptyStateInner);
