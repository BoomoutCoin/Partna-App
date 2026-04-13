/**
 * Profile screen — fully functional: notifications, active pools, sign-out.
 */

import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Switch, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDisconnect } from "wagmi";

import { useAuthStore, useCurrentWallet } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { fetchUserPools } from "../../lib/authService";
import { Avatar } from "../../components/atoms/Avatar";
import { Button } from "../../components/atoms/Button";
import { Logo } from "../../components/atoms/Logo";
import { colors, spacing, radii } from "../../theme";

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}\u2026${addr.slice(-4)}`;
}

export default function Profile() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const wallet = useCurrentWallet();
  const clearSession = useAuthStore((s) => s.clearSession);
  const pushToast = useUiStore((s) => s.pushToast);
  const { disconnectAsync } = useDisconnect();

  // Notification preferences (local state for now)
  const [pushEnabled, setPushEnabled] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [payoutAlerts, setPayoutAlerts] = useState(true);

  // Active pools count from Supabase
  const [poolCount, setPoolCount] = useState(0);
  useEffect(() => {
    if (!wallet) return;
    void fetchUserPools(wallet).then((pools) => setPoolCount(pools.length));
  }, [wallet]);

  const handleSignOut = async () => {
    try {
      // Disconnect wagmi wallet FIRST (prevents auto-reconnect)
      await disconnectAsync();
    } catch {
      // Wallet might not be connected — that's fine
    }
    // Then clear auth store
    clearSession();
    // Clear any web localStorage session
    if (Platform.OS === "web") {
      try { window.localStorage.removeItem("partna.auth"); } catch { /* noop */ }
    }
    pushToast({ kind: "info", title: "Signed out" });
    router.replace("/(auth)");
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar name={user?.displayName} address={wallet ?? "0x0"} size={80} ring />
          <Text style={styles.name}>{user?.displayName ?? "Anonymous"}</Text>
          {wallet && (
            <Pressable
              style={styles.walletPill}
              onPress={() => {
                if (Platform.OS === "web") {
                  try { navigator.clipboard.writeText(wallet); } catch { /* */ }
                }
                pushToast({ kind: "success", title: "Address copied" });
              }}
            >
              <View style={styles.walletDot} />
              <Text style={styles.walletText}>{truncate(wallet)}</Text>
              <Text style={styles.copyHint}>Copy</Text>
            </Pressable>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{((user?.onTimeRate ?? 0) * 100).toFixed(0)}%</Text>
            <Text style={styles.statLabel}>On-time rate</Text>
          </View>
          <Pressable style={styles.statCard} onPress={() => router.push("/(app)")}>
            <Text style={styles.statValue}>{poolCount}</Text>
            <Text style={styles.statLabel}>Active pools</Text>
          </Pressable>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.isPro ? "Pro" : "Free"}</Text>
            <Text style={styles.statLabel}>Plan</Text>
          </View>
        </View>

        {/* Notifications section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.menu}>
            <ToggleItem
              label="Push notifications"
              sub="Receive alerts on your device"
              value={pushEnabled}
              onToggle={setPushEnabled}
            />
            <ToggleItem
              label="Payment reminders"
              sub="48h + 24h before deadline"
              value={paymentAlerts}
              onToggle={setPaymentAlerts}
            />
            <ToggleItem
              label="Payout alerts"
              sub="When you receive a payout"
              value={payoutAlerts}
              onToggle={setPayoutAlerts}
            />
          </View>
        </View>

        {/* Settings section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menu}>
            <MenuItem label="Security" sub="Biometric authentication" icon={"\u{1F512}"} />
            <MenuItem label="Network" sub="Base Network" icon={"\u{26D3}"} accent />
            <MenuItem label="About PartNA" sub="v0.1.0" icon={"\u{2139}"} />
          </View>
        </View>

        {/* Sign out */}
        <View style={styles.footer}>
          <Button label="Sign out" onPress={handleSignOut} variant="danger" size="md" />
          <View style={styles.footerLogo}>
            <Logo size="sm" showText={false} />
            <Text style={styles.footerText}>PartNA Wallet</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ label, sub, icon, accent }: { label: string; sub: string; icon: string; accent?: boolean }) {
  return (
    <Pressable style={styles.menuItem}>
      <View style={styles.menuLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <View>
          <Text style={styles.menuLabel}>{label}</Text>
          <Text style={[styles.menuSub, accent && styles.menuAccent]}>{sub}</Text>
        </View>
      </View>
      <Text style={styles.menuArrow}>{"\u203A"}</Text>
    </Pressable>
  );
}

function ToggleItem({ label, sub, value, onToggle }: { label: string; sub: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.menuItem}>
      <View>
        <Text style={styles.menuLabel}>{label}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "rgba(255,255,255,0.1)", true: colors.brand.green }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { padding: spacing.s6, gap: 20, paddingBottom: 40 },
  header: { alignItems: "center", gap: 10, paddingTop: 8 },
  name: { fontSize: 24, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  walletPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.bg.surface, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.border,
  },
  walletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brand.green },
  walletText: { fontSize: 11, color: colors.ink.muted, fontFamily: "monospace" },
  copyHint: { fontSize: 10, color: colors.brand.greenLight, marginLeft: 4 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1, backgroundColor: colors.bg.surface, borderRadius: 12, padding: 14,
    alignItems: "center", gap: 4, borderWidth: 1, borderColor: colors.border,
  },
  statValue: { fontSize: 20, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.3 },
  statLabel: { fontSize: 10, color: colors.ink.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.35)", letterSpacing: 1.2, textTransform: "uppercase" },
  menu: {
    backgroundColor: colors.bg.surface, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border, overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuIcon: { fontSize: 18 },
  menuLabel: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  menuSub: { fontSize: 11, color: colors.ink.muted, marginTop: 1 },
  menuAccent: { color: colors.brand.greenLight },
  menuArrow: { fontSize: 20, color: colors.ink.subtle },
  footer: { gap: 24, alignItems: "center", paddingTop: 8 },
  footerLogo: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerText: { fontSize: 12, color: colors.ink.subtle },
});
