import { create } from 'zustand';

export type ModalId = 'confirm' | null;

export interface ConfirmSecondaryAction {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'primary' | 'danger' | 'success';
}

export interface ConfirmModalProps {
  title?: string;
  text?: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  verificationText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  secondaryAction?: ConfirmSecondaryAction;
}

interface ModalState {
  currentModal: ModalId;
  confirmModalProps: ConfirmModalProps | null;
  openConfirm: (props: ConfirmModalProps) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  currentModal: null,
  confirmModalProps: null,
  openConfirm: (props) =>
    set({ currentModal: 'confirm', confirmModalProps: props }),
  closeModal: () => set({ currentModal: null, confirmModalProps: null }),
}));
