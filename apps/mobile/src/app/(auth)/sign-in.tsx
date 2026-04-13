/**
 * Sign-in screen — real sign-up flow that creates user in Supabase.
 */

import { useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useConnect } from "wagmi";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { demoSignUp } from "../../lib/authService";
import { DEMO_USER, DEMO_WALLET } from "../../lib/demoData";
import { Logo } from "../../components/atoms/Logo";
import { colors, spacing } from "../../theme";
import type { Address } from "@partna/types";

type Screen = "landing" | "signup" | "connecting";

export default function SignIn() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const pushToast = useUiStore((s) => s.pushToast);
  const { connectors, connectAsync } = useConnect();
  

  const handleWalletConnect = useCallback(async () => {
    setScreen("connecting");
    try {
      // Try WalletConnect first (shows QR modal), then injected
      const wcConnector = connectors.find((c) => c.id === "walletConnect");
      const injectedConnector = connectors.find((c) => c.id === "injected");
      const connector = wcConnector ?? injectedConnector;

      if (!connector) {
        pushToast({ kind: "error", title: "No wallet connector available" });
        setScreen("landing");
        return;
      }

      const result = await connectAsync({ connector });
      const walletAddr = (result.accounts[0] ?? DEMO_WALLET) as Address;

      // Create/upsert user in Supabase with the real wallet address
      const authResult = await demoSignUp(walletAddr.slice(0, 8));
      setSession({
        user: { ...authResult.user, walletAddress: walletAddr },
        jwt: authResult.jwt,
      });
      pushToast({ kind: "success", title: "Wallet connected!" });
      router.replace("/(app)");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      if (!msg.includes("rejected")) {
        pushToast({ kind: "error", title: msg.slice(0, 60) });
      }
      setScreen("landing");
    }
  }, [connectors, connectAsync, setSession, pushToast, router]);
  const [screen, setScreen] = useState<Screen>("landing");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const result = await demoSignUp(name.trim());
      setSession(result);
      pushToast({ kind: "success", title: `Welcome, ${result.user.displayName}!` });
      router.replace("/(app)");
    } catch {
      pushToast({ kind: "error", title: "Sign-up failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setSession({ user: DEMO_USER, jwt: "demo-jwt-token" });
    router.replace("/(app)");
  };

  if (screen === "connecting") {
    return (
      <SafeAreaView style={styles.root}>
        <View style={[styles.signupContent, { justifyContent: "center", alignItems: "center", gap: 16 }]}>
          <ActivityIndicator color={colors.brand.greenLight} size="large" />
          <Text style={styles.signupTitle}>Connecting wallet...</Text>
          <Text style={styles.signupSub}>Approve the connection in your wallet app</Text>
          <Pressable onPress={() => setScreen("landing")} style={{ marginTop: 20 }}>
            <Text style={styles.backText}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === "signup") {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.signupContent}>
          <Pressable onPress={() => setScreen("landing")} style={styles.backBtn}>
            <Text style={styles.backText}>{"\u2190"} Back</Text>
          </Pressable>

          <View style={styles.signupHero}>
            <Logo size="md" showText={false} />
            <Text style={styles.signupTitle}>Create your account</Text>
            <Text style={styles.signupSub}>Enter your name to get started with PartNA Wallet</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>Display name</Text>
            <TextInput
              style={[styles.input, name.length > 0 && styles.inputActive]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Amara, Kofi, Nneka"
              placeholderTextColor="rgba(255,255,255,0.2)"
              autoFocus
              autoCapitalize="words"
              returnKeyType="go"
              onSubmitEditing={handleSignUp}
            />
            <Text style={styles.inputHelper}>This is how other pool members will see you</Text>

            <Pressable
              style={[styles.signupBtn, (!name.trim() || loading) && styles.signupBtnDisabled]}
              onPress={handleSignUp}
              disabled={!name.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signupBtnText}>Create account {"\u2192"}</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.securityRow}>
            <Text style={styles.securityIcon}>{"\u{1F512}"}</Text>
            <Text style={styles.securityText}>Your account is secured on Base blockchain. No passwords to remember.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.glowCircle} />
      <View style={styles.content}>
        <View style={styles.hero}>
          <Logo size="lg" showText showTagline />
          <Text style={styles.tagline}>
            Save together. Build wealth.{"\n"}On-chain rotating savings circles.
          </Text>
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

        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}
            onPress={() => setScreen("signup")}
          >
            <Text style={styles.primaryIcon}>{"\u2709"}</Text>
            <View>
              <Text style={styles.primaryLabel}>Get started</Text>
              <Text style={styles.primarySub}>Create your savings wallet</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}
            onPress={handleWalletConnect}
          >
            <Text style={styles.secondaryIcon}>{"\u{1F4B3}"}</Text>
            <View>
              <Text style={styles.secondaryLabel}>Connect wallet</Text>
              <Text style={styles.secondarySub}>MetaMask, Coinbase, Rainbow</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.button, styles.demo, pressed && styles.pressed]}
            onPress={handleQuickDemo}
          >
            <Text style={styles.demoIcon}>{"\u{1F50D}"}</Text>
            <Text style={styles.demoLabel}>Quick demo (skip sign-up)</Text>
          </Pressable>

          <Text style={styles.footer}>By continuing you agree to our Terms and Privacy Policy</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary, overflow: "hidden" },
  glowCircle: { position: "absolute", top: -100, left: "50%", marginLeft: -200, width: 400, height: 400, borderRadius: 200, backgroundColor: "rgba(37,99,235,0.06)" },
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

  // Sign-up screen
  signupContent: { flex: 1, paddingHorizontal: spacing.s6, paddingTop: 20, justifyContent: "space-between" },
  backBtn: { alignSelf: "flex-start", paddingVertical: 8 },
  backText: { fontSize: 14, color: "#38BDF8", fontWeight: "600" },
  signupHero: { alignItems: "center", gap: 12, marginTop: 20 },
  signupTitle: { fontSize: 24, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  signupSub: { fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center" },
  formSection: { gap: 8 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.5)", letterSpacing: 0.3 },
  input: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  inputActive: { borderColor: colors.brand.green, shadowColor: colors.brand.green, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  inputHelper: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  signupBtn: {
    backgroundColor: colors.brand.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  signupBtnDisabled: { opacity: 0.4 },
  signupBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  securityRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 24 },
  securityIcon: { fontSize: 14 },
  securityText: { fontSize: 11, color: "rgba(255,255,255,0.3)", flex: 1, lineHeight: 16 },
});
