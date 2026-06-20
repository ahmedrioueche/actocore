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

import type { AppPageKind } from '@ahmedrioueche/actocore-shared';

export interface CreateAppPageModalProps {
  projectId: string;
  parentPageId?: string;
  pageKind?: AppPageKind;
}

export interface EditAppPageModalProps {
  projectId: string;
  pageId: string;
}

export interface CreateAppPageFunctionalityModalProps {
  projectId: string;
  pageId: string;
}

export interface EditAppPageFunctionalityModalProps {
  projectId: string;
  pageId: string;
  functionalityId: string;
}

export interface EditAppPageLinkModalProps {
  projectId: string;
  linkId: string;
}

export interface ExportAppLayoutModalProps {
  projectId: string;
}

export interface ImportAppLayoutModalProps {
  projectId: string;
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

export type CreateReportModalProps = Record<string, never>;

export interface ViewReportModalProps {
  reportId: string;
}

export interface EditReportModalProps {
  reportId: string;
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
  createSection: CreateSectionModalProps;
  editSection: EditSectionModalProps;
  actionCreated: ActionCreatedModalProps;
  actionsSdkCode: ActionsSdkCodeModalProps;
  createAppPage: CreateAppPageModalProps;
  editAppPage: EditAppPageModalProps;
  createAppPageFunctionality: CreateAppPageFunctionalityModalProps;
  editAppPageFunctionality: EditAppPageFunctionalityModalProps;
  editAppPageLink: EditAppPageLinkModalProps;
  exportAppLayout: ExportAppLayoutModalProps;
  importAppLayout: ImportAppLayoutModalProps;
  createProject: CreateProjectModalProps;
  inviteMember: InviteMemberModalProps;
  editMember: EditMemberModalProps;
  createPlan: CreatePlanModalProps;
  editPlan: EditPlanModalProps;
  createPlatformManager: CreatePlatformManagerModalProps;
  editPlatformManager: EditPlatformManagerModalProps;
  deleteAccount: DeleteAccountModalProps;
  createReport: CreateReportModalProps;
  viewReport: ViewReportModalProps;
  editReport: EditReportModalProps;
}

export type FeatureModalId = keyof ModalPropsMap;
export type ModalId = 'confirm' | FeatureModalId | null;

export type ModalStackEntry =
  | { instanceId: string; modalId: 'confirm'; props: ConfirmModalProps }
  | {
      instanceId: string;
      modalId: FeatureModalId;
      props: ModalPropsMap[FeatureModalId];
    };

interface LegacyModalState {
  /** @deprecated Read from the modal stack instead. Top entry only. */
  currentModal: ModalId;
  /** @deprecated Read from the modal stack instead. Top confirm entry only. */
  confirmModalProps: ConfirmModalProps | null;
  /** @deprecated Read from the modal stack instead. Top feature entry only. */
  modalProps: ModalPropsMap[keyof ModalPropsMap] | null;
}

interface ModalState extends LegacyModalState {
  stack: ModalStackEntry[];
  openConfirm: (props: ConfirmModalProps) => void;
  openModal: <K extends FeatureModalId>(
    id: K,
    props: ModalPropsMap[K],
  ) => void;
  closeModal: () => void;
  closeModalInstance: (instanceId: string) => void;
  closeAllModals: () => void;
}

let modalInstanceCounter = 0;

function createModalInstanceId() {
  modalInstanceCounter += 1;
  return `modal-${modalInstanceCounter}`;
}

function deriveLegacyState(stack: ModalStackEntry[]): LegacyModalState {
  const top = stack[stack.length - 1];
  if (!top) {
    return {
      currentModal: null,
      confirmModalProps: null,
      modalProps: null,
    };
  }

  if (top.modalId === 'confirm') {
    return {
      currentModal: 'confirm',
      confirmModalProps: top.props,
      modalProps: null,
    };
  }

  return {
    currentModal: top.modalId,
    confirmModalProps: null,
    modalProps: top.props,
  };
}

function applyStackUpdate(
  stack: ModalStackEntry[],
): Pick<ModalState, keyof LegacyModalState | 'stack'> {
  return {
    stack,
    ...deriveLegacyState(stack),
  };
}

export const selectHasOpenModals = (state: ModalState) => state.stack.length > 0;

export const useModalStore = create<ModalState>((set) => ({
  stack: [],
  currentModal: null,
  confirmModalProps: null,
  modalProps: null,
  openConfirm: (props) =>
    set((state) =>
      applyStackUpdate([
        ...state.stack,
        {
          instanceId: createModalInstanceId(),
          modalId: 'confirm',
          props,
        },
      ]),
    ),
  openModal: (id, props) =>
    set((state) =>
      applyStackUpdate([
        ...state.stack,
        {
          instanceId: createModalInstanceId(),
          modalId: id,
          props,
        },
      ]),
    ),
  closeModal: () => set((state) => applyStackUpdate(state.stack.slice(0, -1))),
  closeModalInstance: (instanceId) =>
    set((state) =>
      applyStackUpdate(
        state.stack.filter((entry) => entry.instanceId !== instanceId),
      ),
    ),
  closeAllModals: () => set(applyStackUpdate([])),
}));
