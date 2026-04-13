/**
 * Button — 4 variants, 3 sizes, loading, haptics. Dark theme.
 */

import { memo, useCallback } from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet, type ViewStyle, type TextStyle } from "react-native";
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
  secondary: colors.ink.secondary,
  danger: "#FFFFFF",
  ghost: colors.brand.greenLight,
};

const heightMap: Record<Size, number> = { sm: 36, md: 48, lg: 56 };
const paddingMap: Record<Size, number> = { sm: spacing.s3, md: spacing.s4, lg: spacing.s6 };
const fontMap: Record<Size, TextStyle> = {
  sm: typography.caption as TextStyle,
  md: typography.bodyMedium as TextStyle,
  lg: typography.bodyMedium as TextStyle,
};

function ButtonInner({ label, onPress, variant = "primary", size = "md", loading = false, disabled = false }: ButtonProps) {
  const handlePress = useCallback(() => {
    if (loading || disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [loading, disabled, onPress]);

  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    backgroundColor: bgMap[variant],
    height: heightMap[size],
    paddingHorizontal: paddingMap[size],
    borderRadius: size === "lg" ? 14 : 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    opacity: isDisabled ? 0.5 : 1,
    ...(variant === "secondary" && { borderWidth: 1, borderColor: colors.borderLight }),
    ...(variant === "ghost" && { borderWidth: 1, borderColor: colors.borderLight }),
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
        <ActivityIndicator color={labelColorMap[variant]} size="small" />
      ) : (
        <Text style={[fontMap[size], { color: labelColorMap[variant] }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({ pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] } });

export const Button = memo(ButtonInner);
