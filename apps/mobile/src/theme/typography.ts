/**
 * Typography scale — from CLAUDE.md § "Design tokens".
 *
 * Headings use Outfit (700–800), body uses Inter (400), captions 500.
 * Font loading happens in `src/app/_layout.tsx` at boot via expo-font.
 */

import type { TextStyle } from "react-native";

export const fontFamily = {
  headingBold: "Outfit-Bold",
  headingExtraBold: "Outfit-ExtraBold",
  body: "Inter-Regular",
  bodyMedium: "Inter-Medium",
  bodySemiBold: "Inter-SemiBold",
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 44,
} as const;

export const lineHeight = {
  tight: 1.15,
  normal: 1.35,
  relaxed: 1.55,
} as const;

export const letterSpacing = {
  tight: -0.4,
  normal: 0,
  wide: 0.4,
} as const;

type TypographyVariant = Pick<
  TextStyle,
  "fontFamily" | "fontSize" | "lineHeight" | "letterSpacing"
>;

export const typography: Record<string, TypographyVariant> = {
  displayLarge: {
    fontFamily: fontFamily.headingExtraBold,
    fontSize: fontSize.display,
    lineHeight: Math.round(fontSize.display * lineHeight.tight),
    letterSpacing: letterSpacing.tight,
  },
  h1: {
    fontFamily: fontFamily.headingBold,
    fontSize: fontSize.xxl,
    lineHeight: Math.round(fontSize.xxl * lineHeight.tight),
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamily.headingBold,
    fontSize: fontSize.xl,
    lineHeight: Math.round(fontSize.xl * lineHeight.normal),
  },
  h3: {
    fontFamily: fontFamily.headingBold,
    fontSize: fontSize.lg,
    lineHeight: Math.round(fontSize.lg * lineHeight.normal),
  },
  bodyLarge: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    lineHeight: Math.round(fontSize.md * lineHeight.relaxed),
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    lineHeight: Math.round(fontSize.base * lineHeight.relaxed),
  },
  bodyMedium: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.base,
    lineHeight: Math.round(fontSize.base * lineHeight.relaxed),
  },
  caption: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    lineHeight: Math.round(fontSize.sm * lineHeight.normal),
  },
  micro: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.xs,
    lineHeight: Math.round(fontSize.xs * lineHeight.normal),
    letterSpacing: letterSpacing.wide,
  },
};
