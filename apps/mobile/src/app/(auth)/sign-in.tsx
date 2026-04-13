/**
 * Sign-in screen — Privy OTP + WalletConnect + demo mode for web preview.
 */

import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { DEMO_USER } from "../../lib/demoData";
import { colors, spacing, typography } from "../../theme";

export default function SignIn() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const handleDemo = () => {
    setSession({ user: DEMO_USER, jwt: "demo-jwt-token" });
    router.replace("/(app)");
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.brand}>PartNA</Text>
        <Text style={styles.tagline}>Rotating savings, reimagined.</Text>

        <View style={styles.buttons}>
          <Pressable style={[styles.button, styles.primary]} onPress={handleDemo}>
            <Text style={styles.primaryLabel}>Continue with email or phone</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.secondary]} onPress={handleDemo}>
            <Text style={styles.secondaryLabel}>I have a crypto wallet</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.demo]} onPress={handleDemo}>
            <Text style={styles.demoLabel}>Explore demo</Text>
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
  root: { flex: 1, backgroundColor: colors.ink.primary },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.s6 },
  brand: { ...typography.displayLarge, color: colors.bg.surface },
  tagline: { ...typography.bodyLarge, color: colors.ink.subtle, marginTop: spacing.s2, marginBottom: spacing.s12 },
  buttons: { gap: spacing.s3 },
  button: { paddingVertical: spacing.s4, paddingHorizontal: spacing.s6, borderRadius: 14, alignItems: "center" },
  primary: { backgroundColor: colors.brand.green },
  primaryLabel: { ...typography.bodyMedium, color: colors.bg.surface },
  secondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.ink.subtle },
  secondaryLabel: { ...typography.bodyMedium, color: colors.bg.surface },
  demo: { backgroundColor: "rgba(22,163,74,0.1)", borderWidth: 1, borderColor: colors.brand.green },
  demoLabel: { ...typography.bodyMedium, color: colors.brand.green },
  footer: { ...typography.caption, color: colors.ink.subtle, textAlign: "center", marginTop: spacing.s8 },
});
