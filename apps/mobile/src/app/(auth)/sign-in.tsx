/**
 * Sign-in screen. Minimal Step 6 scaffold — a branded dark screen with two
 * placeholder buttons. Wiring to Privy OTP and WalletConnect lands in Step 7
 * when the atom-level `Button` component exists.
 */

import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { colors, spacing, typography } from "../../theme";

export default function SignIn() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.brand}>PartNA</Text>
        <Text style={styles.tagline}>Rotating savings, reimagined.</Text>

        <View style={styles.buttons}>
          <Pressable style={[styles.button, styles.primary]}>
            <Text style={styles.primaryLabel}>Continue with email or phone</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.secondary]}>
            <Text style={styles.secondaryLabel}>I have a crypto wallet</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          By continuing you agree to our Terms and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink.primary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.s6,
  },
  brand: {
    ...typography.displayLarge,
    color: colors.bg.surface,
  },
  tagline: {
    ...typography.bodyLarge,
    color: colors.ink.subtle,
    marginTop: spacing.s2,
    marginBottom: spacing.s12,
  },
  buttons: {
    gap: spacing.s3,
  },
  button: {
    paddingVertical: spacing.s4,
    paddingHorizontal: spacing.s6,
    borderRadius: 14,
    alignItems: "center",
  },
  primary: {
    backgroundColor: colors.brand.green,
  },
  primaryLabel: {
    ...typography.bodyMedium,
    color: colors.bg.surface,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.ink.subtle,
  },
  secondaryLabel: {
    ...typography.bodyMedium,
    color: colors.bg.surface,
  },
  footer: {
    ...typography.caption,
    color: colors.ink.subtle,
    textAlign: "center",
    marginTop: spacing.s8,
  },
});
