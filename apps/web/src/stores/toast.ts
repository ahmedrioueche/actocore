import { useSyncExternalStore } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

let toasts: ToastItem[] = [];
let toastCounter = 0;
const TOAST_DURATION_MS = 4500;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

export function useToasts() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function dismiss(id: string) {
  if (!toasts.some((item) => item.id === id)) {
    return;
  }
  toasts = toasts.filter((item) => item.id !== id);
  notify();
}

function push(message: string, variant: ToastVariant) {
  const id = `toast-${++toastCounter}`;
  toasts = [...toasts, { id, message, variant }];
  notify();

  window.setTimeout(() => {
    dismiss(id);
  }, TOAST_DURATION_MS);
}

export const toast = {
  success: (message: string) => push(message, 'success'),
  error: (message: string) => push(message, 'error'),
  info: (message: string) => push(message, 'info'),
};

export function dismissToast(id: string) {
  dismiss(id);
}
