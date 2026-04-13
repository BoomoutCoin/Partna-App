/**
 * Skeleton — shimmer placeholder for async components.
 * Uses Reanimated 3 for a UI-thread shimmer animation.
 */

import { memo, useEffect } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors, radii } from "../../theme";

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonInner({ width, height, borderRadius = radii.md, style }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={[{ width, height, borderRadius, overflow: "hidden" }, style]}>
      <Animated.View style={[styles.inner, animStyle, { borderRadius }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
  },
});

export const Skeleton = memo(SkeletonInner);
