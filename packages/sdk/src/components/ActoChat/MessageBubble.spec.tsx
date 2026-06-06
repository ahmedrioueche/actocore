import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { ActocoreContextProvider } from '../../context/actocore-context';
import { createActocoreI18n } from '../../i18n/create-i18n';
import { resolveConfig } from '../../config/resolve-config';
import { MessageBubble } from './MessageBubble';
import type { UiChatMessage } from '../../hooks/use-actocore-chat';

function renderBubble(message: UiChatMessage) {
  const i18n = createActocoreI18n({ locale: 'en' });
  const config = resolveConfig({ apiKey: 'sdk-key' });

  return render(
    <I18nextProvider i18n={i18n}>
      <ActocoreContextProvider config={config}>
        <MessageBubble message={message} sessionId="session-1" />
      </ActocoreContextProvider>
    </I18nextProvider>,
  );
}

describe('MessageBubble', () => {
  it('renders assistant markdown with bold section titles', () => {
    renderBubble({
      id: 'assistant-1',
      role: 'assistant',
      content:
        '**Gym Management**: Memberships, subscriptions, access control.\n\n**Analytics**: Membership growth and revenue tracking.',
    });

    expect(screen.getByText('Gym Management')).toBeTruthy();
    expect(screen.getByText('Analytics')).toBeTruthy();
    expect(screen.queryByText(/\*\*Gym Management\*\*/)).toBeNull();
  });

  it('keeps user messages as plain text', () => {
    renderBubble({
      id: 'user-1',
      role: 'user',
      content: '**not bold**',
    });

    expect(screen.getByText('**not bold**')).toBeTruthy();
  });
});
