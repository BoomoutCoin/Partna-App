/**
 * Pool detail screen — PoolHeader + MemberList + Pay button.
 */

import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Address } from "@partna/types";

import { PoolHeader } from "../../../components/organisms/PoolHeader";
import { MemberList } from "../../../components/organisms/MemberList";
import { Button } from "../../../components/atoms/Button";
import { colors, spacing } from "../../../theme";

export default function PoolDetail() {
  const { poolId } = useLocalSearchParams<{ poolId: string }>();
  const router = useRouter();

  if (!poolId) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Pool not found</Text>
          <Text style={styles.errorSub}>This pool doesn't exist or the link is broken.</Text>
          <Button label="Go back" onPress={() => router.back()} variant="secondary" size="md" />
        </View>
      </SafeAreaView>
    );
  }

  const id = poolId as Address;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Button
          label={"\u2190 Back"}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />
        <PoolHeader poolId={id} />
        <MemberList poolId={id} />
        <Button
          label="Pay now"
          onPress={() => router.push(`/(modals)/pay/${id}`)}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { padding: spacing.s4, gap: spacing.s4, paddingBottom: spacing.s12 },
  errorWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: spacing.s6 },
  errorTitle: { fontSize: 20, fontWeight: "700", color: colors.ink.primary },
  errorSub: { fontSize: 14, color: colors.ink.muted, textAlign: "center" },
});
