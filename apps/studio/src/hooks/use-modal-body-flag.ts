import { useEffect } from 'react';

import { selectHasOpenModals, useModalStore } from '@/stores/modal';

/** Signals open modals so embedded SDK widgets can hide via `hideWhenSelector`. */
export function useModalBodyFlag() {
  const hasOpenModals = useModalStore(selectHasOpenModals);

  useEffect(() => {
    if (hasOpenModals) {
      document.body.setAttribute('data-modal-open', '');
      return () => document.body.removeAttribute('data-modal-open');
    }
    document.body.removeAttribute('data-modal-open');
  }, [hasOpenModals]);
}
