/**
 * Skeleton — shimmer placeholder, dark-mode adapted.
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
  borderRadius?: number | undefined;
  style?: ViewStyle | undefined;
}

function SkeletonInner({ width, height, borderRadius = radii.md, style }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={[{ width, height, borderRadius, overflow: "hidden" }, style]}>
      <Animated.View
        style={[styles.inner, animStyle, { borderRadius }]}
      />
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
