import { beforeEach, describe, expect, it } from 'vitest';

import { useModalStore } from '@/stores/modal';

describe('useModalStore', () => {
  beforeEach(() => {
    useModalStore.setState({
      stack: [],
      currentModal: null,
      confirmModalProps: null,
      modalProps: null,
    });
  });

  it('opens and closes confirm modal', () => {
    const { openConfirm, closeModal } = useModalStore.getState();

    openConfirm({ title: 'Delete?', text: 'Sure?' });
    expect(useModalStore.getState().stack).toHaveLength(1);
    expect(useModalStore.getState().currentModal).toBe('confirm');
    expect(useModalStore.getState().confirmModalProps?.title).toBe('Delete?');

    closeModal();
    expect(useModalStore.getState().stack).toHaveLength(0);
    expect(useModalStore.getState().currentModal).toBeNull();
    expect(useModalStore.getState().confirmModalProps).toBeNull();
  });

  it('stacks feature modals and closes only the top entry', () => {
    const { openModal, closeModal } = useModalStore.getState();

    openModal('editAppPage', { projectId: 'p1', pageId: 'page-1' });
    openModal('createAppPageFunctionality', {
      projectId: 'p1',
      pageId: 'page-1',
    });

    expect(useModalStore.getState().stack).toHaveLength(2);
    expect(useModalStore.getState().currentModal).toBe(
      'createAppPageFunctionality',
    );

    closeModal();
    expect(useModalStore.getState().stack).toHaveLength(1);
    expect(useModalStore.getState().currentModal).toBe('editAppPage');
    expect(
      (useModalStore.getState().modalProps as { pageId: string }).pageId,
    ).toBe('page-1');

    closeModal();
    expect(useModalStore.getState().stack).toHaveLength(0);
    expect(useModalStore.getState().currentModal).toBeNull();
    expect(useModalStore.getState().modalProps).toBeNull();
  });

  it('stacks confirm on top of a feature modal', () => {
    const { openModal, openConfirm, closeModal } = useModalStore.getState();

    openModal('editAppPage', { projectId: 'p1', pageId: 'page-1' });
    openConfirm({ title: 'Delete functionality?', text: 'Sure?' });

    expect(useModalStore.getState().stack).toHaveLength(2);
    expect(useModalStore.getState().currentModal).toBe('confirm');

    closeModal();
    expect(useModalStore.getState().stack).toHaveLength(1);
    expect(useModalStore.getState().currentModal).toBe('editAppPage');
  });

  it('opens report modals with props from the store', () => {
    const { openModal, closeModal, closeAllModals } = useModalStore.getState();

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
    expect(useModalStore.getState().currentModal).toBe('viewReport');

    closeModal();
    expect(useModalStore.getState().currentModal).toBe('createReport');

    closeAllModals();
    expect(useModalStore.getState().stack).toHaveLength(0);
    expect(useModalStore.getState().currentModal).toBeNull();
    expect(useModalStore.getState().modalProps).toBeNull();
  });
});
