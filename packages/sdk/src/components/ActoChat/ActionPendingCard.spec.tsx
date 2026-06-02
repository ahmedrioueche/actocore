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
});

