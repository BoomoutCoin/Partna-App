/**
 * Profile screen — polished dark mode with stat cards, wallet row, settings.
 */

import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAuthStore, useCurrentWallet } from "../../store/authStore";
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

  const handleSignOut = () => {
    clearSession();
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
            <View style={styles.walletPill}>
              <View style={styles.walletDot} />
              <Text style={styles.walletText}>{truncate(wallet)}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{((user?.onTimeRate ?? 0) * 100).toFixed(0)}%</Text>
            <Text style={styles.statLabel}>On-time rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Active pools</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.isPro ? "Pro" : "Free"}</Text>
            <Text style={styles.statLabel}>Plan</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.menu}>
          <MenuItem label="Notifications" sub="Manage push preferences" />
          <MenuItem label="Security" sub="Biometric, recovery phrase" />
          <MenuItem label="Network" sub="Base Network" accent />
          <MenuItem label="About PartNA" sub="v0.1.0" />
        </View>

        {/* Footer */}
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

function MenuItem({ label, sub, accent }: { label: string; sub: string; accent?: boolean }) {
  return (
    <Pressable style={styles.menuItem}>
      <View>
        <Text style={styles.menuLabel}>{label}</Text>
        <Text style={[styles.menuSub, accent && styles.menuAccent]}>{sub}</Text>
      </View>
      <Text style={styles.menuArrow}>{"\u203A"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { padding: spacing.s6, gap: 24 },
  header: { alignItems: "center", gap: 10, paddingTop: 8 },
  name: { fontSize: 24, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  walletPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.bg.surface,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brand.green },
  walletText: { fontSize: 11, color: colors.ink.muted, fontFamily: "monospace" },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 20, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.3 },
  statLabel: { fontSize: 10, color: colors.ink.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  menu: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  menuSub: { fontSize: 11, color: colors.ink.muted, marginTop: 1 },
  menuAccent: { color: colors.brand.greenLight },
  menuArrow: { fontSize: 20, color: colors.ink.subtle },
  footer: { gap: 24, alignItems: "center", paddingBottom: 20 },
  footerLogo: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerText: { fontSize: 12, color: colors.ink.subtle },
});
