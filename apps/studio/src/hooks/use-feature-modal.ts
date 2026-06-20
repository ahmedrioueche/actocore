import {
  createContext,
  createElement,
  useCallback,
  useContext,
  type ReactNode,
} from 'react';

import {
  useModalStore,
  type ConfirmModalProps,
  type FeatureModalId,
  type ModalId,
  type ModalPropsMap,
} from '@/stores/modal';

export interface ModalInstanceContextValue {
  instanceId: string;
  modalId: ModalId;
  props: unknown;
  stackIndex: number;
  isTop: boolean;
  zIndex: number;
}

export const ModalInstanceContext =
  createContext<ModalInstanceContextValue | null>(null);

export function ModalInstanceProvider({
  value,
  children,
}: {
  value: ModalInstanceContextValue;
  children: ReactNode;
}) {
  return createElement(ModalInstanceContext.Provider, { value }, children);
}

export function useModalInstanceContext() {
  return useContext(ModalInstanceContext);
}

export function useFeatureModal<K extends FeatureModalId>(modalId: K) {
  const ctx = useModalInstanceContext();
  const closeModalInstance = useModalStore((state) => state.closeModalInstance);

  const isOpen = ctx?.modalId === modalId;
  const props = (isOpen ? ctx?.props : null) as ModalPropsMap[K] | null;

  const closeModal = useCallback(() => {
    if (ctx?.modalId === modalId) {
      closeModalInstance(ctx.instanceId);
    }
  }, [closeModalInstance, ctx, modalId]);

  return {
    isOpen,
    props,
    closeModal,
    isTop: ctx?.isTop ?? false,
    zIndex: ctx?.zIndex ?? 50,
  };
}

export function useConfirmModal() {
  const ctx = useModalInstanceContext();
  const closeModalInstance = useModalStore((state) => state.closeModalInstance);

  const isOpen = ctx?.modalId === 'confirm';
  const props = (isOpen ? ctx?.props : null) as ConfirmModalProps | null;

  const closeModal = useCallback(() => {
    if (ctx?.modalId === 'confirm') {
      closeModalInstance(ctx.instanceId);
    }
  }, [closeModalInstance, ctx]);

  return {
    isOpen,
    props,
    closeModal,
    isTop: ctx?.isTop ?? false,
    zIndex: ctx?.zIndex ?? 50,
  };
}
