/**
 * Create pool — 4-step wizard + PoolFactory.createPool() contract write.
 *
 * Steps:
 *   1. Pool name + privacy
 *   2. Contribution amount (balance check shown here — P0 checklist)
 *   3. Member count + cycle interval
 *   4. Review + deploy
 */

import { useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { parseUnits } from "viem";
import { useWriteContract } from "wagmi";
import { ABIs } from "@partna/types";

import { useBalance } from "../../../hooks/useBalance";
import { useCurrentWallet } from "../../../store/authStore";
import { useUiStore } from "../../../store/uiStore";
import { currentAddresses } from "../../../lib/wagmi";
import { api } from "../../../lib/api";
import { Button } from "../../../components/atoms/Button";
import { InputField } from "../../../components/atoms/InputField";
import { colors, spacing, typography, radii } from "../../../theme";

const INTERVALS = [
  { label: "Weekly", seconds: 7 * 86400 },
  { label: "Biweekly", seconds: 14 * 86400 },
  { label: "Monthly", seconds: 30 * 86400 },
];

export default function CreatePool() {
  const router = useRouter();
  const wallet = useCurrentWallet();
  const { formatted: balance } = useBalance(wallet);
  const pushToast = useUiStore((s) => s.pushToast);
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [amountStr, setAmountStr] = useState("");
  const [numMembers, setNumMembers] = useState("5");
  const [intervalIdx, setIntervalIdx] = useState(0);
  const [deploying, setDeploying] = useState(false);

  const contribution = amountStr ? parseUnits(amountStr, 6) : 0n;
  const addrs = currentAddresses();

  const deploy = useCallback(async () => {
    if (!addrs.poolFactory) {
      pushToast({ kind: "error", title: "Pool factory not configured" });
      return;
    }
    setDeploying(true);
    try {
      const hash = await writeContractAsync({
        address: addrs.poolFactory,
        abi: ABIs.POOL_FACTORY_ABI,
        functionName: "createPool",
        args: [contribution, Number(numMembers), BigInt(INTERVALS[intervalIdx]!.seconds)],
      });

      // Post off-chain metadata to the API
      await api.post("pools/metadata", {
        json: {
          contractAddress: hash, // will be replaced with event-parsed address
          displayName: name,
          isPrivate,
        },
      });

      pushToast({ kind: "success", title: "Pool created!" });
      router.replace("/(app)");
    } catch (err) {
      pushToast({
        kind: "error",
        title: err instanceof Error ? err.message.slice(0, 80) : "Deploy failed",
      });
    } finally {
      setDeploying(false);
    }
  }, [addrs, contribution, numMembers, intervalIdx, name, isPrivate, writeContractAsync, pushToast, router]);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Create a pool</Text>
        <Text style={styles.stepLabel}>Step {step} of 4</Text>

        {step === 1 && (
          <View style={styles.fields}>
            <InputField label="Pool name" value={name} onChangeText={setName} placeholder="My susu circle" />
            <Button
              label={isPrivate ? "Private (invite-only)" : "Public (discoverable)"}
              onPress={() => setIsPrivate(!isPrivate)}
              variant="secondary"
              size="md"
            />
            <Button label="Next" onPress={() => setStep(2)} disabled={!name.trim()} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.fields}>
            <InputField
              label="Contribution per cycle (USDC)"
              value={amountStr}
              onChangeText={setAmountStr}
              variant="numeric"
              placeholder="100"
              helper={`Your balance: $${balance} USDC. Deposit: $${amountStr ? (parseFloat(amountStr) * 2).toFixed(2) : "0"}`}
              {...(parseFloat(amountStr) < 10
                ? { error: "Min $10" }
                : parseFloat(amountStr) > 10000
                  ? { error: "Max $10,000" }
                  : {})}
            />
            <Button
              label="Next"
              onPress={() => setStep(3)}
              disabled={!amountStr || parseFloat(amountStr) < 10 || parseFloat(amountStr) > 10000}
            />
            <Button label="Back" onPress={() => setStep(1)} variant="ghost" />
          </View>
        )}

        {step === 3 && (
          <View style={styles.fields}>
            <InputField
              label="Number of members (3–20)"
              value={numMembers}
              onChangeText={setNumMembers}
              variant="numeric"
              {...(Number(numMembers) < 3
                ? { error: "Min 3" }
                : Number(numMembers) > 20
                  ? { error: "Max 20" }
                  : {})}
            />
            <Text style={styles.fieldLabel}>Cycle interval</Text>
            <View style={styles.chipRow}>
              {INTERVALS.map((iv, i) => (
                <Button
                  key={iv.label}
                  label={iv.label}
                  onPress={() => setIntervalIdx(i)}
                  variant={i === intervalIdx ? "primary" : "secondary"}
                  size="sm"
                />
              ))}
            </View>
            <Button label="Review" onPress={() => setStep(4)} />
            <Button label="Back" onPress={() => setStep(2)} variant="ghost" />
          </View>
        )}

        {step === 4 && (
          <View style={styles.fields}>
            <View style={styles.reviewCard}>
              <ReviewRow label="Name" value={name} />
              <ReviewRow label="Contribution" value={`$${amountStr} USDC`} />
              <ReviewRow label="Deposit" value={`$${amountStr ? (parseFloat(amountStr) * 2).toFixed(2) : "0"} USDC`} />
              <ReviewRow label="Members" value={numMembers} />
              <ReviewRow label="Interval" value={INTERVALS[intervalIdx]!.label} />
              <ReviewRow label="Visibility" value={isPrivate ? "Private" : "Public"} />
            </View>
            <Button label="Deploy pool" onPress={deploy} loading={deploying} size="lg" />
            <Button label="Back" onPress={() => setStep(3)} variant="ghost" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { padding: spacing.s6, gap: spacing.s4 },
  title: { ...typography.h1, color: colors.ink.primary },
  stepLabel: { ...typography.caption, color: colors.ink.muted },
  fields: { gap: spacing.s4 },
  fieldLabel: { ...typography.caption, color: colors.ink.secondary },
  chipRow: { flexDirection: "row", gap: spacing.s2 },
  reviewCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    padding: spacing.s4,
    gap: spacing.s3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewRow: { flexDirection: "row", justifyContent: "space-between" },
  reviewLabel: { ...typography.body, color: colors.ink.muted },
  reviewValue: { ...typography.bodyMedium, color: colors.ink.primary },
});
