/**
 * InputField — label, value, error, helper, variant (text/numeric/phone).
 */

import { memo, useState, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, type KeyboardTypeOptions } from "react-native";
import { colors, spacing, typography, radii } from "../../theme";

type InputVariant = "text" | "numeric" | "phone";

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  variant?: InputVariant;
  placeholder?: string;
  error?: string | undefined;
  helper?: string | undefined;
  editable?: boolean;
}

const kbMap: Record<InputVariant, KeyboardTypeOptions> = {
  text: "default",
  numeric: "decimal-pad",
  phone: "phone-pad",
};

function InputFieldInner({
  label,
  value,
  onChangeText,
  variant = "text",
  placeholder,
  error,
  helper,
  editable = true,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);

  const borderColor = error
    ? colors.semantic.danger
    : focused
      ? colors.brand.green
      : colors.border;

  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, { borderColor }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink.subtle}
        keyboardType={kbMap[variant]}
        editable={editable}
        onFocus={onFocus}
        onBlur={onBlur}
        accessibilityLabel={label}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.s1 },
  label: { ...typography.caption, color: colors.ink.secondary },
  input: {
    ...typography.body,
    color: colors.ink.primary,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
  },
  error: { ...typography.micro, color: colors.semantic.danger },
  helper: { ...typography.micro, color: colors.ink.muted },
});

export const InputField = memo(InputFieldInner);
