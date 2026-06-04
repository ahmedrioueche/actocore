import { beforeEach, describe, expect, it } from 'vitest';

import { useModalStore } from '@/stores/modal';

describe('useModalStore', () => {
  beforeEach(() => {
    useModalStore.setState({
      currentModal: null,
      confirmModalProps: null,
    });
  });

  it('opens and closes confirm modal', () => {
    const { openConfirm, closeModal } = useModalStore.getState();

    openConfirm({ title: 'Delete?', text: 'Sure?' });
    expect(useModalStore.getState().currentModal).toBe('confirm');
    expect(useModalStore.getState().confirmModalProps?.title).toBe('Delete?');

    closeModal();
    expect(useModalStore.getState().currentModal).toBeNull();
    expect(useModalStore.getState().confirmModalProps).toBeNull();
  });
});
