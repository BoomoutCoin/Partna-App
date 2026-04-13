/**
 * Color tokens — SOURCE OF TRUTH.
 *
 * Exact values from CLAUDE.md § "Design tokens". Do NOT hardcode hex values
 * anywhere in components — always import from here so a design refresh is a
 * single-file change.
 */

export const colors = {
  brand: {
    green: "#16A34A",
    dark: "#14532D",
  },

  ink: {
    primary: "#0F1423",
    secondary: "#374151",
    muted: "#6B7280",
    subtle: "#9CA3AF",
  },

  bg: {
    primary: "#F2F4F7",
    surface: "#FFFFFF",
    elevated: "#F8F9FB",
  },

  border: "rgba(15,20,35,0.07)",

  status: {
    paid: { bg: "#DCFCE7", text: "#166534" },
    pending: { bg: "#FEF3C7", text: "#92400E" },
    due: { bg: "#FEE2E2", text: "#991B1B" },
    slashed: { bg: "#F3F4F6", text: "#4B5563" },
    receiving: { bg: "#EDE9FE", text: "#5B21B6" },
    active: { bg: "#DCFCE7", text: "#166534" },
    filling: { bg: "#DBEAFE", text: "#1E40AF" },
    completed: { bg: "#F3F4F6", text: "#4B5563" },
  },

  semantic: {
    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",
    info: "#2563EB",
  },
} as const;

export type ColorTokens = typeof colors;
export type StatusKey = keyof typeof colors.status;
