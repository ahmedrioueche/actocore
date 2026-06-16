import { beforeEach, describe, expect, it } from 'vitest';

import { useModalStore } from '@/stores/modal';

describe('useModalStore', () => {
  beforeEach(() => {
    useModalStore.setState({
      currentModal: null,
      confirmModalProps: null,
      modalProps: null,
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

  it('opens report modals with props from the store', () => {
    const { openModal, closeModal } = useModalStore.getState();

    openModal('createReport', {});
    expect(useModalStore.getState().currentModal).toBe('createReport');

    openModal('viewReport', { reportId: 'r1' });
    expect(useModalStore.getState().currentModal).toBe('viewReport');
    expect(
      (useModalStore.getState().modalProps as { reportId: string }).reportId,
    ).toBe('r1');

    openModal('editReport', { reportId: 'r2' });
    expect(useModalStore.getState().currentModal).toBe('editReport');

    closeModal();
    expect(useModalStore.getState().currentModal).toBeNull();
    expect(useModalStore.getState().modalProps).toBeNull();
  });
});
