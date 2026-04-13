/**
 * Profile screen — wallet address, on-time rate, Pro status, sign out.
 */

import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAuthStore, useCurrentWallet } from "../../store/authStore";
import { Avatar } from "../../components/atoms/Avatar";
import { Button } from "../../components/atoms/Button";
import { colors, spacing, typography, radii } from "../../theme";

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
      <View style={styles.content}>
        <View style={styles.header}>
          <Avatar
            name={user?.displayName}
            address={wallet ?? "0x0"}
            size={72}
            ring
          />
          <Text style={styles.name}>{user?.displayName ?? "Anonymous"}</Text>
          <Text style={styles.wallet}>{wallet ? truncate(wallet) : "—"}</Text>
        </View>

        <View style={styles.stats}>
          <StatItem label="On-time rate" value={`${((user?.onTimeRate ?? 0) * 100).toFixed(0)}%`} />
          <StatItem label="Plan" value={user?.isPro ? "Pro" : "Free"} />
        </View>

        <View style={styles.actions}>
          <Button label="Sign out" onPress={handleSignOut} variant="danger" size="md" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  content: { padding: spacing.s6, gap: spacing.s6 },
  header: { alignItems: "center", gap: spacing.s3 },
  name: { ...typography.h2, color: colors.ink.primary },
  wallet: { ...typography.caption, color: colors.ink.muted },
  stats: {
    flexDirection: "row",
    gap: spacing.s4,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    padding: spacing.s4,
  },
  statItem: { flex: 1, alignItems: "center", gap: spacing.s1 },
  statLabel: { ...typography.micro, color: colors.ink.muted, textTransform: "uppercase" },
  statValue: { ...typography.h3, color: colors.ink.primary },
  actions: { marginTop: spacing.s8 },
});
