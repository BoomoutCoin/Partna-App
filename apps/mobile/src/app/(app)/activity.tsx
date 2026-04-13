/**
 * Activity screen — transaction history + notification inbox.
 */

import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/molecules/EmptyState";
import { colors, spacing, typography } from "../../theme";

export default function Activity() {
  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>
      <EmptyState
        emoji={"\u{1F4CB}"}
        title="No activity yet"
        subtitle="Your contributions, payouts, and notifications will appear here."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  header: { padding: spacing.s6, paddingBottom: spacing.s2 },
  title: { ...typography.h1, color: colors.ink.primary },
});
