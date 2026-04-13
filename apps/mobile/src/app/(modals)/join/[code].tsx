/**
 * Join via invite link — deep link target.
 *
 * Fetches the invite preview (unauthenticated GET /invites/:code),
 * shows pool details, then calls join() on the SusuPool contract.
 */

import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";


import { api, extractApiError } from "../../../lib/api";
import { Button } from "../../../components/atoms/Button";
import { colors, spacing, typography, radii } from "../../../theme";

interface InvitePreview {
  code: string;
  poolContractAddress: string;
  poolDisplayName: string;
  organiserDisplayName: string;
  expiresAt: number;
  isExpired: boolean;
}

export default function JoinByInvite() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    api
      .get(`invites/${code}`)
      .json<InvitePreview>()
      .then(setPreview)
      .catch(async (err) => setError(await extractApiError(err)))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color={colors.brand.green} size="large" />
      </SafeAreaView>
    );
  }

  if (error || !preview) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            {error === "Invite expired" ? "Invite expired" : "Invalid invite"}
          </Text>
          <Text style={styles.errorBody}>
            {error ?? "This invite link is no longer valid."}
          </Text>
          <Button label="Go home" onPress={() => router.replace("/(app)")} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <Text style={styles.heading}>You're invited!</Text>

        <View style={styles.card}>
          <Text style={styles.poolName}>{preview.poolDisplayName}</Text>
          <Text style={styles.meta}>Organised by {preview.organiserDisplayName}</Text>
          <Text style={styles.meta}>Pool: {preview.poolContractAddress.slice(0, 10)}...</Text>
        </View>

        <Button
          label="Join this pool"
          onPress={() => router.push(`/pools/${preview.poolContractAddress}`)}
          size="lg"
        />
        <Button
          label="Not now"
          onPress={() => router.replace("/(app)")}
          variant="ghost"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary, justifyContent: "center" },
  center: { padding: spacing.s6, alignItems: "center", gap: spacing.s4 },
  heading: { ...typography.h1, color: colors.ink.primary },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    padding: spacing.s6,
    width: "100%",
    gap: spacing.s2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  poolName: { ...typography.h2, color: colors.ink.primary },
  meta: { ...typography.body, color: colors.ink.muted },
  errorTitle: { ...typography.h2, color: colors.semantic.danger },
  errorBody: { ...typography.body, color: colors.ink.muted, textAlign: "center" },
});
