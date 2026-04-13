/**
 * Spacing scale — from CLAUDE.md § "Design tokens".
 *
 * Always reference `spacing.s4` etc. in styles instead of raw numbers.
 */

export const spacing = {
  s0: 0,
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s6: 24,
  s8: 32,
  s12: 48,
  s16: 64,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export type SpacingKey = keyof typeof spacing;
