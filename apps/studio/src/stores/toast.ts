import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

let toastCounter = 0;
const TOAST_DURATION_MS = 4500;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, variant = 'info') => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, variant }],
    }));

    window.setTimeout(() => {
      if (get().toasts.some((toast) => toast.id === id)) {
        get().dismiss(id);
      }
    }, TOAST_DURATION_MS);
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push(message, 'success'),
  error: (message: string) => useToastStore.getState().push(message, 'error'),
  info: (message: string) => useToastStore.getState().push(message, 'info'),
};
