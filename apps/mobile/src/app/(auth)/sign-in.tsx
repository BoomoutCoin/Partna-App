/**
 * Sign-in screen — elegant branded entry with logo + 3 auth paths.
 */

import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { DEMO_USER } from "../../lib/demoData";
import { Logo } from "../../components/atoms/Logo";
import { colors, spacing } from "../../theme";

export default function SignIn() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const handleDemo = () => {
    setSession({ user: DEMO_USER, jwt: "demo-jwt-token" });
    router.replace("/(app)");
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Subtle glow effect behind logo */}
      <View style={styles.glowCircle} />

      <View style={styles.content}>
        {/* Top section: logo + tagline */}
        <View style={styles.hero}>
          <Logo size="lg" showText showTagline />
          <Text style={styles.tagline}>
            Save together. Build wealth.{"\n"}On-chain rotating savings circles.
          </Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>90%+</Text>
              <Text style={styles.statLabel}>On-time rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>$0.01</Text>
              <Text style={styles.statLabel}>Gas per tx</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>Base</Text>
              <Text style={styles.statLabel}>Network</Text>
            </View>
          </View>
        </View>

        {/* Bottom section: auth buttons */}
        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}
            onPress={handleDemo}
          >
            <Text style={styles.primaryIcon}>&#x2709;</Text>
            <View>
              <Text style={styles.primaryLabel}>Continue with email or phone</Text>
              <Text style={styles.primarySub}>No seed phrase needed</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}
            onPress={handleDemo}
          >
            <Text style={styles.secondaryIcon}>&#x1F4B3;</Text>
            <View>
              <Text style={styles.secondaryLabel}>Connect crypto wallet</Text>
              <Text style={styles.secondarySub}>MetaMask, Coinbase, Rainbow</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.button, styles.demo, pressed && styles.pressed]}
            onPress={handleDemo}
          >
            <Text style={styles.demoIcon}>&#x1F50D;</Text>
            <Text style={styles.demoLabel}>Explore demo</Text>
          </Pressable>

          <Text style={styles.footer}>
            By continuing you agree to our Terms and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary, overflow: "hidden" },
  glowCircle: {
    position: "absolute",
    top: -100,
    left: "50%",
    marginLeft: -200,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(37,99,235,0.06)",
  },
  content: { flex: 1, justifyContent: "space-between", paddingHorizontal: spacing.s6, paddingTop: 60, paddingBottom: 24 },
  hero: { alignItems: "center", gap: 20 },
  tagline: { fontSize: 15, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 22 },
  statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bg.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 16, gap: 16, marginTop: 8 },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 16, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.3 },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: colors.border },
  bottom: { gap: 10 },
  button: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 14 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  primary: { backgroundColor: colors.brand.green },
  primaryIcon: { fontSize: 20 },
  primaryLabel: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  primarySub: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 },
  secondary: { backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.borderLight },
  secondaryIcon: { fontSize: 20 },
  secondaryLabel: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  secondarySub: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 },
  demo: { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(56,189,248,0.25)", justifyContent: "center" },
  demoIcon: { fontSize: 16 },
  demoLabel: { fontSize: 14, fontWeight: "600", color: "#38BDF8" },
  footer: { fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 8 },
});
