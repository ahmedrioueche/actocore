import { useEffect } from 'react';

import { useModalStore } from '@/stores/modal';

/** Signals open modals so embedded SDK widgets can hide via `hideWhenSelector`. */
export function useModalBodyFlag() {
  const currentModal = useModalStore((state) => state.currentModal);

  useEffect(() => {
    if (currentModal) {
      document.body.setAttribute('data-modal-open', '');
      return () => document.body.removeAttribute('data-modal-open');
    }
    document.body.removeAttribute('data-modal-open');
  }, [currentModal]);
}
