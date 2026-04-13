/**
 * Pay Now — MOST CRITICAL SCREEN.
 *
 * Full-screen modal — NO tab bar. Demo mode simulates the full payment
 * lifecycle with timed step transitions so the user sees every state.
 */

import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatUnits, type Address } from "viem";

import { useBalance } from "../../../hooks/useBalance";
import { useCurrentWallet } from "../../../store/authStore";
import { getDemoPool } from "../../../lib/demoData";
import { AmountDisplay } from "../../../components/molecules/AmountDisplay";
import { PaymentSummary } from "../../../components/molecules/PaymentSummary";
import { Button } from "../../../components/atoms/Button";
import { colors, spacing, typography } from "../../../theme";

type Step = "idle" | "biometric" | "approving" | "sending" | "confirming" | "success" | "error";

const stepLabels: Record<Step, string> = {
  idle: "Confirm payment \u2192",
  biometric: "Authenticating\u2026",
  approving: "Approving USDC\u2026",
  sending: "Sending payment\u2026",
  confirming: "Confirming on-chain\u2026",
  success: "Payment confirmed!",
  error: "Payment failed",
};

export default function PayNow() {
  const { poolId } = useLocalSearchParams<{ poolId: string }>();
  const router = useRouter();
  const wallet = useCurrentWallet();
  const id = (poolId ?? "") as Address;

  const pool = getDemoPool(id);
  const contribution = pool?.contribution ?? 100_000000n;
  const amount = formatUnits(contribution, 6);

  const { formatted: balanceBefore } = useBalance(wallet);
  const balanceBeforeNum = parseFloat(balanceBefore.replace(/,/g, ""));
  const amountNum = parseFloat(amount);
  const gasEstimate = "0.01";
  const balanceAfter = Math.max(0, balanceBeforeNum - amountNum - 0.01).toFixed(2);

  const [step, setStep] = useState<Step>("idle");

  // Demo: simulate the full payment lifecycle
  const execute = useCallback(() => {
    setStep("biometric");
    setTimeout(() => setStep("approving"), 800);
    setTimeout(() => setStep("sending"), 2000);
    setTimeout(() => setStep("confirming"), 3500);
    setTimeout(() => setStep("success"), 5000);
  }, []);

  // Auto-dismiss 1.5s after success
  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => router.back(), 1500);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  const isProcessing = step !== "idle" && step !== "success" && step !== "error";

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
          balanceBefore={balanceBefore.replace(/,/g, "")}
          amount={amount}
          estimatedGas={gasEstimate}
          balanceAfter={balanceAfter}
        />

        {step === "success" && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>Payment confirmed on-chain!</Text>
          </View>
        )}

        {step === "error" && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Something went wrong. Your balance is unchanged.</Text>
          </View>
        )}

        <View style={styles.bottom}>
          {step === "error" ? (
            <Button label="Try again" onPress={() => { setStep("idle"); }} size="lg" />
          ) : (
            <Button
              label={stepLabels[step]}
              onPress={execute}
              size="lg"
              loading={isProcessing}
              disabled={step === "success"}
            />
          )}
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
  successBox: {
    backgroundColor: colors.status.paid.bg,
    padding: spacing.s4,
    borderRadius: 10,
    alignItems: "center",
  },
  successText: { ...typography.bodyMedium, color: colors.status.paid.text },
  errorBox: {
    backgroundColor: colors.status.due.bg,
    padding: spacing.s4,
    borderRadius: 10,
    alignItems: "center",
  },
  errorText: { ...typography.bodyMedium, color: colors.status.due.text },
  bottom: { paddingTop: spacing.s4 },
});
