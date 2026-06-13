import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { ActionPendingCard } from './ActionPendingCard';
import { createActocoreI18n } from '../../i18n/create-i18n';
import { ActocoreContextProvider } from '../../context/actocore-context';
import { resolveConfig } from '../../config/resolve-config';

describe('ActionPendingCard', () => {
  it('blocks non-allowlisted actions and does not run handler', async () => {
    const deployHandler = vi.fn();
    const i18n = createActocoreI18n({ locale: 'en' });

    const config = resolveConfig({
      apiKey: 'sdk-key',
      security: {
        allowedActionNames: ['deploy'],
        enforceActionAllowlist: true,
      },
    });

    render(
      <I18nextProvider i18n={i18n}>
        <ActocoreContextProvider config={config} actions={{ deploy: deployHandler }}>
          <ActionPendingCard
            sessionId="session-1"
            message={{
              id: 'm-1',
              role: 'assistant',
              content: 'I can delete this project',
              intent: 'action',
              action: {
                actionId: 'a-1',
                actionName: 'delete_project',
                status: 'pending',
                input: {},
              },
            }}
          />
        </ActocoreContextProvider>
      </I18nextProvider>,
    );

    expect(screen.getByText('This action is not allowed in your application.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Run action' })).toBeNull();
    expect(deployHandler).not.toHaveBeenCalled();
  });

  it('shows guidance when no handler is registered', () => {
    const i18n = createActocoreI18n({ locale: 'en' });
    const config = resolveConfig({ apiKey: 'sdk-key' });

    render(
      <I18nextProvider i18n={i18n}>
        <ActocoreContextProvider config={config} actions={{}}>
          <ActionPendingCard
            sessionId="session-1"
            message={{
              id: 'm-0',
              role: 'assistant',
              content: 'Ready to run delete_user',
              intent: 'action',
              action: {
                actionId: 'a-0',
                actionName: 'delete_user',
                status: 'pending',
                input: { email: 'bob@demo.com' },
              },
            }}
          />
        </ActocoreContextProvider>
      </I18nextProvider>,
    );

    expect(
      screen.getByText('This action is not wired up in your app yet.'),
    ).toBeTruthy();
    expect(
      screen.getByText(/Register a handler for "delete_user"/),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Run action' })).toBeNull();
  });

  it('hides run button and shows success feedback after handler completes', async () => {
    const deleteHandler = vi.fn();
    const i18n = createActocoreI18n({ locale: 'en' });

    const config = resolveConfig({
      apiKey: 'sdk-key',
      security: {
        allowedActionNames: ['delete_user'],
        enforceActionAllowlist: true,
      },
    });

    render(
      <I18nextProvider i18n={i18n}>
        <ActocoreContextProvider
          config={config}
          actions={{ delete_user: deleteHandler }}
        >
          <ActionPendingCard
            sessionId="session-1"
            message={{
              id: 'm-2',
              role: 'assistant',
              content: 'Ready to run delete_user',
              intent: 'action',
              action: {
                actionId: 'a-2',
                actionName: 'delete_user',
                status: 'pending',
                input: { email: 'bob@demo.com' },
              },
            }}
          />
        </ActocoreContextProvider>
      </I18nextProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Run action' }));

    expect(await screen.findByText('delete_user completed')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Run action' })).toBeNull();
    expect(deleteHandler).toHaveBeenCalledOnce();
  });

  it('keeps success state after remount when action already ran', async () => {
    const deleteHandler = vi.fn().mockResolvedValue({});
    const i18n = createActocoreI18n({ locale: 'en' });
    const config = resolveConfig({
      apiKey: 'sdk-key',
      security: {
        allowedActionNames: ['delete_user'],
        enforceActionAllowlist: true,
      },
    });
    const message = {
      id: 'm-3',
      role: 'assistant' as const,
      content: 'Ready to run delete_user',
      intent: 'action' as const,
      action: {
        actionId: 'a-3',
        actionName: 'delete_user',
        status: 'pending' as const,
        input: { email: 'bob@demo.com' },
      },
    };

    const tree = (
      <I18nextProvider i18n={i18n}>
        <ActocoreContextProvider
          config={config}
          actions={{ delete_user: deleteHandler }}
        >
          <ActionPendingCard sessionId="session-1" message={message} />
        </ActocoreContextProvider>
      </I18nextProvider>
    );

    const { unmount } = render(tree);
    fireEvent.click(screen.getByRole('button', { name: 'Run action' }));
    expect(await screen.findByText('delete_user completed')).toBeTruthy();

    unmount();
    render(tree);

    expect(screen.getByText('delete_user completed')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Run action' })).toBeNull();
    expect(deleteHandler).toHaveBeenCalledOnce();
  });
});

