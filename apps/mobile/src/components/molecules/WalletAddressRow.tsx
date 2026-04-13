/**
 * WalletAddressRow — truncated address with copy-to-clipboard.
 */

import { memo, useCallback } from "react";
import { Text, Pressable, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useUiStore } from "../../store/uiStore";
import { colors, spacing, typography, radii } from "../../theme";

interface WalletAddressRowProps {
  address: string;
  label?: string | undefined;
}

function WalletAddressRowInner({ address, label }: WalletAddressRowProps) {
  const pushToast = useUiStore((s) => s.pushToast);

  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(address);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    pushToast({ kind: "success", title: "Address copied" });
  }, [address, pushToast]);

  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <Pressable onPress={copy} style={styles.row}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Text style={styles.address}>{truncated}</Text>
      <Text style={styles.copyHint}>Tap to copy</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
    backgroundColor: colors.bg.elevated,
    padding: spacing.s3,
    borderRadius: radii.md,
  },
  label: { ...typography.caption, color: colors.ink.muted },
  address: { ...typography.bodyMedium, color: colors.ink.primary, fontFamily: "monospace" },
  copyHint: { ...typography.micro, color: colors.ink.subtle, marginLeft: "auto" },
});

export const WalletAddressRow = memo(WalletAddressRowInner);
