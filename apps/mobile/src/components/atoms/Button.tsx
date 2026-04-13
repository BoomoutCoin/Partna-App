/**
 * Button — 4 variants (primary/secondary/danger/ghost), 3 sizes (sm/md/lg),
 * loading state, haptic feedback on press.
 */

import { memo, useCallback } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors, spacing, typography } from "../../theme";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
}

const bgMap: Record<Variant, string> = {
  primary: colors.brand.green,
  secondary: colors.bg.elevated,
  danger: colors.semantic.danger,
  ghost: "transparent",
};

const labelColorMap: Record<Variant, string> = {
  primary: "#FFFFFF",
  secondary: colors.ink.primary,
  danger: "#FFFFFF",
  ghost: colors.brand.green,
};

const heightMap: Record<Size, number> = { sm: 36, md: 48, lg: 56 };
const paddingMap: Record<Size, number> = { sm: spacing.s3, md: spacing.s4, lg: spacing.s6 };
const fontMap: Record<Size, TextStyle> = {
  sm: typography.caption as TextStyle,
  md: typography.bodyMedium as TextStyle,
  lg: typography.bodyMedium as TextStyle,
};

function ButtonInner({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
}: ButtonProps) {
  const handlePress = useCallback(() => {
    if (loading || disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [loading, disabled, onPress]);

  const isDisabled = disabled || loading;
  const bg = bgMap[variant];
  const labelColor = labelColorMap[variant];

  const containerStyle: ViewStyle = {
    backgroundColor: bg,
    height: heightMap[size],
    paddingHorizontal: paddingMap[size],
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    opacity: isDisabled ? 0.5 : 1,
    ...(variant === "secondary" && {
      borderWidth: 1,
      borderColor: colors.border,
    }),
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <Text style={[fontMap[size], { color: labelColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
});

export const Button = memo(ButtonInner);
