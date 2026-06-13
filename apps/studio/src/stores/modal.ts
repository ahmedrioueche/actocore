import { create } from 'zustand';

import type {
  PlatformManagerData,
  StudioPlan,
} from '@ahmedrioueche/actocore-shared';

import type { ActionParameterType } from '@/utils/action-schema-builder';

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
  /** Preselect this section in the create form. */
  defaultSectionId?: string;
}

export interface EditActionModalProps {
  projectId: string;
  actionId: string;
}

export interface CreateSectionModalProps {
  projectId: string;
}

export interface EditSectionModalProps {
  projectId: string;
  sectionId: string;
}

export interface ActionCreatedModalProps {
  actionName: string;
  parameters: { name: string; type: ActionParameterType }[];
}

export interface ActionsSdkCodeModalProps {
  projectId: string;
}

export interface CreateAppPageModalProps {
  projectId: string;
}

export interface EditAppPageModalProps {
  projectId: string;
  pageId: string;
}

export type CreateProjectModalProps = Record<string, never>;

export interface InviteMemberModalProps {
  /** Opened without props — form state is local to the modal. */
}

export interface EditMemberModalProps {
  userId: string;
  username?: string;
  displayName?: string;
  projectIds: string[];
}

export type CreatePlanModalProps = Record<string, never>;

export interface EditPlanModalProps {
  plan: StudioPlan;
}

export type CreatePlatformManagerModalProps = Record<string, never>;

export interface EditPlatformManagerModalProps {
  manager: PlatformManagerData;
}

export type DeleteAccountModalProps = Record<string, never>;

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
  createSection: CreateSectionModalProps;
  editSection: EditSectionModalProps;
  actionCreated: ActionCreatedModalProps;
  actionsSdkCode: ActionsSdkCodeModalProps;
  createAppPage: CreateAppPageModalProps;
  editAppPage: EditAppPageModalProps;
  createProject: CreateProjectModalProps;
  inviteMember: InviteMemberModalProps;
  editMember: EditMemberModalProps;
  createPlan: CreatePlanModalProps;
  editPlan: EditPlanModalProps;
  createPlatformManager: CreatePlatformManagerModalProps;
  editPlatformManager: EditPlatformManagerModalProps;
  deleteAccount: DeleteAccountModalProps;
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
