/**
 * Toast notification + ToastContainer (global).
 * Reads from uiStore and auto-dismisses after durationMs.
 */

import { memo, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUiStore, type Toast as ToastType, type ToastKind } from "../../store/uiStore";
import { colors, spacing, typography, radii } from "../../theme";

const bgMap: Record<ToastKind, string> = {
  success: colors.status.paid.bg,
  error: colors.status.due.bg,
  warning: colors.status.pending.bg,
  info: "#DBEAFE",
};

const textMap: Record<ToastKind, string> = {
  success: colors.status.paid.text,
  error: colors.status.due.text,
  warning: colors.status.pending.text,
  info: "#1E40AF",
};

function ToastItem({ toast }: { toast: ToastType }) {
  const dismiss = useUiStore((s) => s.dismissToast);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => clearTimeout(timer);
  }, [toast.id, toast.durationMs, dismiss]);

  return (
    <Animated.View
      entering={SlideInUp}
      exiting={SlideOutUp}
      style={[styles.toast, { backgroundColor: bgMap[toast.kind] }]}
    >
      <Pressable onPress={() => dismiss(toast.id)} style={styles.toastInner}>
        <Text style={[styles.toastTitle, { color: textMap[toast.kind] }]}>{toast.title}</Text>
        {toast.body && (
          <Text style={[styles.toastBody, { color: textMap[toast.kind] }]}>{toast.body}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

function ToastContainerInner() {
  const toasts = useUiStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + spacing.s2 }]} pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: spacing.s4,
    right: spacing.s4,
    zIndex: 9999,
    gap: spacing.s2,
  },
  toast: {
    borderRadius: radii.md,
    overflow: "hidden",
  },
  toastInner: {
    padding: spacing.s4,
    gap: 2,
  },
  toastTitle: { ...typography.bodyMedium },
  toastBody: { ...typography.caption },
});

export const ToastContainer = memo(ToastContainerInner);
