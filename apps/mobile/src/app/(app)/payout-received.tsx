/**
 * Payout Received — celebration screen.
 *
 * Full-screen dark modal (#0F1423 background).
 * Large green amount with count-up animation (Reanimated 3).
 * Retention copy always visible before user can dismiss.
 * Share button for organic growth.
 */

import { useEffect } from "react";
import { View, Text, Share, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSharedValue, withTiming, Easing } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Button } from "../../components/atoms/Button";
import { colors, spacing, typography } from "../../theme";

export default function PayoutReceived() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    amount: string;
    deposit: string;
    cyclesRemaining: string;
    nextDueDate: string;
    poolId: string;
  }>();

  const amount = parseFloat(params.amount ?? "0");
  const deposit = params.deposit ?? "0";
  const cyclesRemaining = params.cyclesRemaining ?? "0";
  const nextDueDate = params.nextDueDate ?? "—";

  // Count-up animation
  const animValue = useSharedValue(0);
  useEffect(() => {
    animValue.value = withTiming(amount, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [amount, animValue]);

  const handleShare = async () => {
    await Share.share({
      message: `I just received $${amount.toFixed(2)} USDC from my PartNA susu pool! 🎉\n\nJoin rotating savings circles on PartNA Wallet — https://partna.app`,
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.congrats}>Payout received!</Text>

        <Text style={styles.amount}>${amount.toFixed(2)}</Text>
        <Text style={styles.currency}>USDC</Text>

        {/* Retention copy — ALWAYS visible before dismiss (P0 checklist) */}
        <View style={styles.retentionCard}>
          <Text style={styles.retentionLine}>
            🔐 Your ${deposit} deposit stays locked. {cyclesRemaining} more cycles remaining.
          </Text>
          <Text style={styles.retentionLine}>
            Your next contribution is due {nextDueDate}.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button label="Share" onPress={handleShare} variant="secondary" size="md" />
          <Button
            label="Back to pool →"
            onPress={() => router.replace(`/(app)/pools/${params.poolId}`)}
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink.primary },
  content: {
    flex: 1,
    padding: spacing.s6,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.s4,
  },
  congrats: { ...typography.h2, color: colors.bg.surface },
  amount: { ...typography.displayLarge, color: colors.brand.green },
  currency: { ...typography.bodyMedium, color: colors.ink.subtle },
  retentionCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: spacing.s4,
    gap: spacing.s3,
    width: "100%",
  },
  retentionLine: { ...typography.body, color: colors.ink.subtle },
  actions: { gap: spacing.s3, width: "100%", marginTop: spacing.s4 },
});
