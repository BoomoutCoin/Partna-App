/**
 * NotificationBanner — urgent(amber) / payout(purple) / info(blue).
 */

import { memo } from "react";
import { Text, Pressable, StyleSheet } from "react-native";
import { spacing, typography, radii } from "../../theme";

type BannerVariant = "urgent" | "payout" | "info";

interface NotificationBannerProps {
  variant: BannerVariant;
  title: string;
  body: string;
  onPress?: () => void;
}

const variantStyles: Record<BannerVariant, { bg: string; text: string; accent: string }> = {
  urgent: { bg: "#FFFBEB", text: "#92400E", accent: "#D97706" },
  payout: { bg: "#F5F3FF", text: "#5B21B6", accent: "#7C3AED" },
  info: { bg: "#EFF6FF", text: "#1E40AF", accent: "#2563EB" },
};

function NotificationBannerInner({ variant, title, body, onPress }: NotificationBannerProps) {
  const v = variantStyles[variant];
  return (
    <Pressable
      onPress={onPress}
      style={[styles.banner, { backgroundColor: v.bg, borderLeftColor: v.accent }]}
    >
      <Text style={[styles.title, { color: v.text }]}>{title}</Text>
      <Text style={[styles.body, { color: v.text }]}>{body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radii.md,
    borderLeftWidth: 4,
    padding: spacing.s4,
    gap: 2,
  },
  title: { ...typography.bodyMedium },
  body: { ...typography.caption },
});

export const NotificationBanner = memo(NotificationBannerInner);
