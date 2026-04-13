/**
 * Ephemeral UI state — toasts and a global loading overlay.
 *
 * Do NOT persist this. Everything here should reset on cold start.
 */

import { create } from "zustand";

export type ToastKind = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  durationMs: number;
}

interface UiState {
  toasts: Toast[];
  isLoading: boolean;
  loadingLabel: string | null;

  pushToast: (toast: Omit<Toast, "id" | "durationMs"> & { durationMs?: number }) => string;
  dismissToast: (id: string) => void;
  showLoading: (label?: string) => void;
  hideLoading: () => void;
}

let toastCounter = 0;

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  isLoading: false,
  loadingLabel: null,

  pushToast: (toast) => {
    const id = `t_${++toastCounter}`;
    const durationMs = toast.durationMs ?? 3500;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id, durationMs }] }));
    return id;
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  showLoading: (label) => set({ isLoading: true, loadingLabel: label ?? null }),
  hideLoading: () => set({ isLoading: false, loadingLabel: null }),
}));
