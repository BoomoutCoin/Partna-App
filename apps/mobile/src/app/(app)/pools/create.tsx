/**
 * Create pool — 4-step wizard that saves to Supabase.
 */

import { useState, useCallback } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCurrentWallet, useAuthStore } from "../../../store/authStore";
import { useUiStore } from "../../../store/uiStore";
import { createPoolInDb } from "../../../lib/authService";
import { useBalance } from "../../../hooks/useBalance";
import { Button } from "../../../components/atoms/Button";
import { DEMO_WALLET } from "../../../lib/demoData";
import { colors, spacing } from "../../../theme";

const INTERVALS = [
  { label: "Weekly", value: "7 days", seconds: 604800 },
  { label: "Biweekly", value: "14 days", seconds: 1209600 },
  { label: "Monthly", value: "30 days", seconds: 2592000 },
];

export default function CreatePool() {
  const router = useRouter();
  const wallet = useCurrentWallet() ?? DEMO_WALLET;
  const user = useAuthStore((s) => s.user);
  const { formatted: balance } = useBalance(wallet);
  const pushToast = useUiStore((s) => s.pushToast);

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [amountStr, setAmountStr] = useState("100");
  const [numMembers, setNumMembers] = useState("5");
  const [intervalIdx, setIntervalIdx] = useState(0);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [_newPoolAddr, setNewPoolAddr] = useState("");

  const amountNum = parseFloat(amountStr) || 0;
  const membersNum = parseInt(numMembers) || 0;
  const deposit = amountNum * 2;
  const totalTvl = deposit * membersNum;
  const interval = INTERVALS[intervalIdx]!;

  const deploy = useCallback(async () => {
    // Validation guard
    if (name.trim().length < 2) { pushToast({ kind: "warning", title: "Pool name must be at least 2 characters" }); return; }
    if (amountNum < 10 || amountNum > 10000) { pushToast({ kind: "warning", title: "Contribution must be $10–$10,000" }); return; }
    if (membersNum < 3 || membersNum > 20) { pushToast({ kind: "warning", title: "Members must be 3–20" }); return; }
    if (totalTvl > 50000) { pushToast({ kind: "warning", title: "TVL exceeds $50k cap" }); return; }

    setDeploying(true);
    try {
      const result = await createPoolInDb({
        displayName: name.trim(),
        contribution: amountStr,
        numMembers: membersNum,
        interval: interval.label,
        isPrivate,
        organiserAddress: wallet,
      });

      if (result.success) {
        setNewPoolAddr(result.poolAddress);
        setDeployed(true);
        pushToast({ kind: "success", title: "Pool created!" });
      } else {
        pushToast({ kind: "error", title: "Pool creation failed" });
      }
    } catch {
      pushToast({ kind: "error", title: "Network error" });
    } finally {
      setDeploying(false);
    }
  }, [name, amountStr, membersNum, interval, isPrivate, wallet, pushToast]);

  const amountError = amountNum < 10 ? "Min $10 USDC" : amountNum > 10000 ? "Max $10,000" : null;
  const membersError = membersNum < 3 ? "Min 3 members" : membersNum > 20 ? "Max 20" : null;
  const tvlError = totalTvl > 50000 ? "Exceeds $50k TVL cap" : null;

  if (deployed) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.successScreen}>
          <Text style={styles.successEmoji}>{"\u{2705}"}</Text>
          <Text style={styles.successTitle}>Pool created!</Text>
          <Text style={styles.successName}>{name}</Text>
          <View style={styles.successCard}>
            <SuccessRow label="Contribution" value={`$${amountStr} USDC`} />
            <SuccessRow label="Deposit" value={`$${deposit.toFixed(2)} USDC`} />
            <SuccessRow label="Members" value={numMembers} />
            <SuccessRow label="Cycle" value={interval.label} />
            <SuccessRow label="Status" value="Filling" accent />
          </View>
          <Text style={styles.successHint}>Share the invite link to fill your pool</Text>
          <Button label="Go to home" onPress={() => router.replace("/(app)")} size="lg" />
          <Button label="Create another" onPress={() => { setDeployed(false); setStep(1); setName(""); }} variant="ghost" size="md" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
            <Text style={styles.backText}>{"\u2190"} {step > 1 ? "Back" : "Cancel"}</Text>
          </Pressable>
          <Text style={styles.stepLabel}>Step {step} of 4</Text>
        </View>

        {/* Step indicator */}
        <View style={styles.stepDots}>
          {[1, 2, 3, 4].map((s) => (
            <View key={s} style={[styles.dot, s <= step && styles.dotActive, s === step && styles.dotCurrent]} />
          ))}
        </View>

        {/* Step 1: Name */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Name your pool</Text>
            <Text style={styles.stepSub}>Give your savings circle a name that members will recognize</Text>
            <TextInput
              style={[styles.input, name.length > 0 && styles.inputActive]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Family Susu, Work Tontine"
              placeholderTextColor="rgba(255,255,255,0.2)"
              autoFocus
            />
            <Pressable style={styles.toggleRow} onPress={() => setIsPrivate(!isPrivate)}>
              <View style={[styles.toggle, isPrivate && styles.toggleOn]}>
                <View style={[styles.toggleDot, isPrivate && styles.toggleDotOn]} />
              </View>
              <View>
                <Text style={styles.toggleLabel}>{isPrivate ? "Private" : "Public"}</Text>
                <Text style={styles.toggleSub}>{isPrivate ? "Invite-only" : "Anyone can discover"}</Text>
              </View>
            </Pressable>
            <Button label="Next \u2192" onPress={() => setStep(2)} disabled={!name.trim()} size="lg" />
          </View>
        )}

        {/* Step 2: Amount */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Set contribution</Text>
            <Text style={styles.stepSub}>How much each member pays per cycle</Text>
            <View style={styles.amountInputWrap}>
              <Text style={styles.amountPrefix}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amountStr}
                onChangeText={setAmountStr}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={styles.amountSuffix}>USDC</Text>
            </View>
            {amountError && <Text style={styles.errorText}>{amountError}</Text>}
            <View style={styles.infoCard}>
              <InfoRow label="Your balance" value={`$${balance} USDC`} />
              <InfoRow label="Security deposit" value={`$${deposit.toFixed(2)} USDC`} />
              <InfoRow label="Deposit = 2\u00d7 contribution" value="" muted />
            </View>
            <Button label="Next \u2192" onPress={() => setStep(3)} disabled={!!amountError || !amountStr} size="lg" />
          </View>
        )}

        {/* Step 3: Members + Interval */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Pool size & cycle</Text>
            <Text style={styles.stepSub}>How many members and how often</Text>

            <Text style={styles.fieldLabel}>Number of members</Text>
            <View style={styles.memberPicker}>
              {[3, 4, 5, 7, 10, 15, 20].map((n) => (
                <Pressable
                  key={n}
                  style={[styles.memberChip, parseInt(numMembers) === n && styles.memberChipActive]}
                  onPress={() => setNumMembers(String(n))}
                >
                  <Text style={[styles.memberChipText, parseInt(numMembers) === n && styles.memberChipTextActive]}>{n}</Text>
                </Pressable>
              ))}
            </View>
            {membersError && <Text style={styles.errorText}>{membersError}</Text>}

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Cycle interval</Text>
            <View style={styles.intervalPicker}>
              {INTERVALS.map((iv, i) => (
                <Pressable
                  key={iv.label}
                  style={[styles.intervalChip, i === intervalIdx && styles.intervalChipActive]}
                  onPress={() => setIntervalIdx(i)}
                >
                  <Text style={[styles.intervalText, i === intervalIdx && styles.intervalTextActive]}>{iv.label}</Text>
                  <Text style={[styles.intervalSub, i === intervalIdx && styles.intervalSubActive]}>{iv.value}</Text>
                </Pressable>
              ))}
            </View>

            {tvlError && <Text style={styles.errorText}>{tvlError}</Text>}

            <Button label="Review \u2192" onPress={() => setStep(4)} disabled={!!membersError || !!tvlError} size="lg" />
          </View>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review your pool</Text>
            <Text style={styles.stepSub}>Confirm everything looks right</Text>

            <View style={styles.reviewCard}>
              <ReviewRow label="Pool name" value={name} />
              <ReviewRow label="Contribution" value={`$${amountStr} USDC / ${interval.label.toLowerCase()}`} />
              <ReviewRow label="Security deposit" value={`$${deposit.toFixed(2)} USDC`} />
              <ReviewRow label="Members" value={`${numMembers} people`} />
              <ReviewRow label="Total pot / cycle" value={`$${(amountNum * membersNum).toFixed(2)} USDC`} highlight />
              <ReviewRow label="Visibility" value={isPrivate ? "Private" : "Public"} />
              <ReviewRow label="Organised by" value={user?.displayName ?? "You"} />
            </View>

            <Pressable
              style={[styles.deployBtn, deploying && styles.deployBtnDisabled]}
              onPress={deploy}
              disabled={deploying}
            >
              {deploying ? (
                <View style={styles.deployLoading}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.deployBtnText}>Deploying pool...</Text>
                </View>
              ) : (
                <Text style={styles.deployBtnText}>Deploy pool {"\u{1F680}"}</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.label, muted && infoStyles.muted]}>{label}</Text>
      <Text style={[infoStyles.value, muted && infoStyles.muted]}>{value}</Text>
    </View>
  );
}

function ReviewRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={reviewStyles.row}>
      <Text style={reviewStyles.label}>{label}</Text>
      <Text style={[reviewStyles.value, highlight && reviewStyles.highlight]}>{value}</Text>
    </View>
  );
}

function SuccessRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={reviewStyles.row}>
      <Text style={reviewStyles.label}>{label}</Text>
      <Text style={[reviewStyles.value, accent && { color: colors.brand.greenLight }]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  label: { fontSize: 13, color: "rgba(255,255,255,0.45)" },
  value: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  muted: { fontSize: 11, color: "rgba(255,255,255,0.25)" },
});

const reviewStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontSize: 13, color: "rgba(255,255,255,0.45)" },
  value: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  highlight: { color: colors.brand.greenLight, fontSize: 15, fontWeight: "800" },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { padding: spacing.s6, paddingBottom: 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  backText: { fontSize: 14, fontWeight: "600", color: "#38BDF8" },
  stepLabel: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  stepDots: { flexDirection: "row", gap: 8, marginBottom: 28 },
  dot: { height: 3, flex: 1, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.08)" },
  dotActive: { backgroundColor: colors.brand.green },
  dotCurrent: { backgroundColor: colors.brand.greenLight },
  stepContent: { gap: 16 },
  stepTitle: { fontSize: 24, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  stepSub: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 8 },
  input: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  inputActive: { borderColor: colors.brand.green },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", paddingHorizontal: 3 },
  toggleOn: { backgroundColor: colors.brand.green },
  toggleDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.4)" },
  toggleDotOn: { backgroundColor: "#FFFFFF", alignSelf: "flex-end" },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  toggleSub: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  amountInputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bg.elevated, borderRadius: 14, borderWidth: 1.5, borderColor: colors.borderLight, paddingHorizontal: 16, paddingVertical: 12 },
  amountPrefix: { fontSize: 28, fontWeight: "800", color: "rgba(255,255,255,0.3)", marginRight: 4 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: "800", color: "#FFFFFF", letterSpacing: -1, fontFamily: "monospace" },
  amountSuffix: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.3)" },
  infoCard: { backgroundColor: colors.bg.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
  errorText: { fontSize: 12, color: "#FCA5A5", fontWeight: "500" },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.5)", letterSpacing: 0.3, marginBottom: 8 },
  memberPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  memberChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.borderLight },
  memberChipActive: { backgroundColor: colors.brand.green, borderColor: colors.brand.green },
  memberChipText: { fontSize: 15, fontWeight: "700", color: "rgba(255,255,255,0.5)" },
  memberChipTextActive: { color: "#FFFFFF" },
  intervalPicker: { flexDirection: "row", gap: 8 },
  intervalChip: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.borderLight, alignItems: "center" },
  intervalChipActive: { backgroundColor: "rgba(22,163,74,0.15)", borderColor: colors.brand.green },
  intervalText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.5)" },
  intervalTextActive: { color: colors.brand.greenLight },
  intervalSub: { fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 },
  intervalSubActive: { color: "rgba(74,222,128,0.6)" },
  reviewCard: { backgroundColor: colors.bg.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  deployBtn: { backgroundColor: colors.brand.green, borderRadius: 14, paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  deployBtnDisabled: { opacity: 0.6 },
  deployBtnText: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  deployLoading: { flexDirection: "row", alignItems: "center", gap: 8 },
  successScreen: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.s6, gap: 16 },
  successEmoji: { fontSize: 56 },
  successTitle: { fontSize: 28, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  successName: { fontSize: 16, color: "rgba(255,255,255,0.5)" },
  successCard: { backgroundColor: colors.bg.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, width: "100%" },
  successHint: { fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center" },
});
