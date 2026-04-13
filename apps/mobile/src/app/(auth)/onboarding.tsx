/**
 * Onboarding — 3-slide carousel (dark theme).
 */

import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "../../components/atoms/Button";
import { colors, spacing, typography } from "../../theme";


const slides = [
  {
    emoji: "\u{1F91D}",
    title: "Save together",
    body: "Join rotating savings circles with friends, family, or your community. Everyone contributes, everyone benefits.",
  },
  {
    emoji: "\u{1F512}",
    title: "Secured on-chain",
    body: "Smart contracts enforce contributions and automate payouts. No middleman, no missed payments, no dropout.",
  },
  {
    emoji: "\u{1F4B0}",
    title: "Get your payout",
    body: "Each cycle, one member receives the full pot. Your deposit stays locked to keep everyone accountable.",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      router.replace("/(auth)/sign-in");
    }
  }, [index, router]);

  const skip = useCallback(() => {
    router.replace("/(auth)/sign-in");
  }, [router]);

  const slide = slides[index]!;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Pressable onPress={skip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <View style={styles.slideContent}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </View>

        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <Button
          label={index < slides.length - 1 ? "Next" : "Get started"}
          onPress={next}
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink.primary },
  content: { flex: 1, padding: spacing.s6, justifyContent: "space-between" },
  skipBtn: { alignSelf: "flex-end" },
  skipText: { ...typography.bodyMedium, color: colors.ink.subtle },
  slideContent: { alignItems: "center", gap: spacing.s4 },
  emoji: { fontSize: 64 },
  title: { ...typography.h1, color: colors.bg.surface, textAlign: "center" },
  body: { ...typography.bodyLarge, color: colors.ink.subtle, textAlign: "center" },
  dots: { flexDirection: "row", justifyContent: "center", gap: spacing.s2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink.muted },
  dotActive: { backgroundColor: colors.brand.green, width: 24 },
});
