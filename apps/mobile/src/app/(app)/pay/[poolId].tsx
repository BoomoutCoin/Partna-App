/**
 * Pay Now — MOST CRITICAL SCREEN.
 *
 * Full-screen modal — NO tab bar.
 * No navigation escape except "Cancel — I'll pay later".
 * Large fixed amount display. PaymentSummary. Single confirm button.
 * useEffect auto-dismisses modal 1.5s after isSuccess.
 */

import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatUnits, type Address } from "viem";
import { useReadContract } from "wagmi";
import { ABIs } from "@partna/types";

import { useContribute } from "../../../hooks/useContribute";
import { useBalance } from "../../../hooks/useBalance";
import { useCurrentWallet } from "../../../store/authStore";
import { AmountDisplay } from "../../../components/molecules/AmountDisplay";
import { PaymentSummary } from "../../../components/molecules/PaymentSummary";
import { Button } from "../../../components/atoms/Button";
import { colors, spacing, typography } from "../../../theme";

export default function PayNow() {
  const { poolId } = useLocalSearchParams<{ poolId: string }>();
  const router = useRouter();
  const wallet = useCurrentWallet();
  const id = (poolId ?? "") as Address;

  const { data: contributionRaw } = useReadContract({
    address: id,
    abi: ABIs.SUSU_POOL_ABI,
    functionName: "contribution",
  });
  const contribution = (contributionRaw as bigint | undefined) ?? 0n;
  const amount = formatUnits(contribution, 6);

  const { formatted: balanceBefore } = useBalance(wallet);
  const balanceBeforeNum = parseFloat(balanceBefore);
  const amountNum = parseFloat(amount);
  const gasEstimate = "0.01";
  const balanceAfter = Math.max(0, balanceBeforeNum - amountNum - 0.01).toFixed(2);

  const contribute = useContribute(id, wallet!);

  // Auto-dismiss 1.5s after success
  useEffect(() => {
    if (contribute.isSuccess) {
      const timer = setTimeout(() => router.back(), 1500);
      return () => clearTimeout(timer);
    }
  }, [contribute.isSuccess, router]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.cancel}>
          <Text style={styles.cancelText}>Cancel — I'll pay later</Text>
        </Pressable>

        <View style={styles.center}>
          <Text style={styles.heading}>Cycle payment</Text>
          <AmountDisplay amount={amount} size="lg" />
          <Text style={styles.currency}>USDC</Text>
        </View>

        <PaymentSummary
          balanceBefore={balanceBefore}
          amount={amount}
          estimatedGas={gasEstimate}
          balanceAfter={balanceAfter}
        />

        {contribute.error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{contribute.error}</Text>
            <Pressable onPress={contribute.reset}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.bottom}>
          <Button
            label={contribute.label}
            onPress={contribute.execute}
            size="lg"
            loading={
              contribute.step !== "idle" &&
              contribute.step !== "success" &&
              contribute.step !== "error"
            }
            disabled={contribute.isSuccess}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.surface },
  content: { flex: 1, padding: spacing.s6, justifyContent: "space-between" },
  cancel: { alignSelf: "flex-start" },
  cancelText: { ...typography.bodyMedium, color: colors.ink.muted },
  center: { alignItems: "center", gap: spacing.s1 },
  heading: { ...typography.caption, color: colors.ink.muted, textTransform: "uppercase" },
  currency: { ...typography.bodyMedium, color: colors.ink.muted },
  errorBox: {
    backgroundColor: colors.status.due.bg,
    padding: spacing.s4,
    borderRadius: 10,
    gap: spacing.s2,
  },
  errorText: { ...typography.body, color: colors.status.due.text },
  retryText: { ...typography.bodyMedium, color: colors.brand.green },
  bottom: { paddingTop: spacing.s4 },
});
