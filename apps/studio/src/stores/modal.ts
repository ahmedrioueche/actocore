import { create } from 'zustand';

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

export interface UploadKnowledgeModalProps {
  projectId: string;
}

export interface CreateApiKeyModalProps {
  projectId: string;
}

export interface EditApiKeyModalProps {
  projectId: string;
  keyId: string;
  currentName: string;
}

export interface IssuedApiKeyModalProps {
  apiKey: string;
}

export interface CreateActionModalProps {
  projectId: string;
}

export interface EditActionModalProps {
  projectId: string;
  actionId: string;
}

/**
 * Registry of feature modals (besides `confirm`) and the props each requires.
 * Props are passed through the store — never directly to the modal component.
 */
export interface ModalPropsMap {
  uploadKnowledge: UploadKnowledgeModalProps;
  createApiKey: CreateApiKeyModalProps;
  editApiKey: EditApiKeyModalProps;
  issuedApiKey: IssuedApiKeyModalProps;
  createAction: CreateActionModalProps;
  editAction: EditActionModalProps;
}

export type ModalId = 'confirm' | keyof ModalPropsMap | null;

interface ModalState {
  currentModal: ModalId;
  confirmModalProps: ConfirmModalProps | null;
  modalProps: ModalPropsMap[keyof ModalPropsMap] | null;
  openConfirm: (props: ConfirmModalProps) => void;
  openModal: <K extends keyof ModalPropsMap>(
    id: K,
    props: ModalPropsMap[K],
  ) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  currentModal: null,
  confirmModalProps: null,
  modalProps: null,
  openConfirm: (props) =>
    set({ currentModal: 'confirm', confirmModalProps: props }),
  openModal: (id, props) => set({ currentModal: id, modalProps: props }),
  closeModal: () =>
    set({ currentModal: null, confirmModalProps: null, modalProps: null }),
}));
