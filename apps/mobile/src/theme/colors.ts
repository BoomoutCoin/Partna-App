/**
 * Color tokens — dark-first design from PartNA component library.
 */

export const colors = {
  brand: {
    green: "#16A34A",
    greenLight: "#4ADE80",
    dark: "#14532D",
  },

  // Dark-mode surfaces (primary palette)
  bg: {
    primary: "#0F1423",       // main dark background
    surface: "#161B2E",       // card/surface layer
    elevated: "#1C2340",      // elevated cards, inputs
    glass: "rgba(255,255,255,0.04)", // glass overlay
  },

  ink: {
    primary: "#FFFFFF",
    secondary: "rgba(255,255,255,0.75)",
    muted: "rgba(255,255,255,0.45)",
    subtle: "rgba(255,255,255,0.25)",
  },

  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.12)",

  status: {
    paid: { bg: "rgba(22,163,74,0.15)", text: "#4ADE80", accent: "#16A34A" },
    pending: { bg: "rgba(217,119,6,0.15)", text: "#FBBF24", accent: "#D97706" },
    due: { bg: "rgba(220,38,38,0.15)", text: "#FCA5A5", accent: "#DC2626" },
    slashed: { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.4)", accent: "#6B7280" },
    receiving: { bg: "rgba(124,58,237,0.15)", text: "#C4B5FD", accent: "#7C3AED" },
    active: { bg: "rgba(37,99,235,0.15)", text: "#93C5FD", accent: "#2563EB" },
    filling: { bg: "rgba(217,119,6,0.15)", text: "#FBBF24", accent: "#D97706" },
    completed: { bg: "rgba(22,163,74,0.15)", text: "#4ADE80", accent: "#16A34A" },
  },

  semantic: {
    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",
    info: "#2563EB",
  },

  // Gradient presets
  gradient: {
    balanceCard: ["#0F1423", "#1A2A18"],
    potCard: ["#0F1423", "#0E2A18"],
  },
} as const;

export type ColorTokens = typeof colors;
export type StatusKey = keyof typeof colors.status;
