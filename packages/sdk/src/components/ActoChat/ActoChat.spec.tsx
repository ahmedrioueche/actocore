import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ActocoreProvider } from '../../provider/actocore-provider';
import { ActoChat } from './ActoChat';

const sendMessage = vi.fn(async () => undefined);

const chatState = vi.hoisted(() => ({
  isInitializing: false,
  sessionId: 'session-test' as string | undefined,
}));

vi.mock('../../hooks/use-actocore-chat', () => {
  return {
    useActocoreChat: () => ({
      messages: [],
      sessionId: chatState.sessionId,
      hasMoreHistory: false,
      isInitializing: chatState.isInitializing,
      isSending: false,
      isStreaming: false,
      isLoadingMoreHistory: false,
      isStartingNewConversation: false,
      error: null,
      sendMessage,
      stopGenerating: vi.fn(),
      loadMoreHistory: vi.fn(),
      startNewConversation: vi.fn(),
      clearError: vi.fn(),
    }),
  };
});

describe('ActoChat', () => {
  it('sends a message through the hook', async () => {
    chatState.isInitializing = false;
    chatState.sessionId = 'session-test';
    sendMessage.mockClear();

    render(
      <ActocoreProvider apiKey="sdk-key" i18n={{ locale: 'en' }}>
        <ActoChat />
      </ActocoreProvider>,
    );

    const composer = screen.getByPlaceholderText('Type a message…');
    fireEvent.change(composer, { target: { value: 'Hello from test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith('Hello from test');
    });
  });

  it('updates UI copy when locale changes', () => {
    const { rerender } = render(
      <ActocoreProvider apiKey="sdk-key" i18n={{ locale: 'en' }}>
        <ActoChat />
      </ActocoreProvider>,
    );

    expect(screen.getByPlaceholderText('Type a message…')).toBeTruthy();

    rerender(
      <ActocoreProvider apiKey="sdk-key" i18n={{ locale: 'fr' }}>
        <ActoChat />
      </ActocoreProvider>,
    );

    expect(screen.getByPlaceholderText('Écrivez un message…')).toBeTruthy();
  });

  it('uses launcher icon URL in the chat header', () => {
    render(
      <ActocoreProvider
        apiKey="sdk-key"
        i18n={{ locale: 'en' }}
        ui={{
          launcher: {
            iconUrl: 'https://cdn.example.com/brand.svg',
          },
        }}
      >
        <ActoChat />
      </ActocoreProvider>,
    );

    const headerIcon = document.querySelector('.ac-chat__header-icon img');
    expect(headerIcon).toBeTruthy();
    expect(headerIcon).toHaveAttribute(
      'src',
      'https://cdn.example.com/brand.svg',
    );
  });

  it('keeps the composer visible but disabled while initializing', () => {
    chatState.isInitializing = true;
    chatState.sessionId = undefined;

    render(
      <ActocoreProvider apiKey="sdk-key" i18n={{ locale: 'en' }}>
        <ActoChat />
      </ActocoreProvider>,
    );

    expect(screen.getByPlaceholderText('Type a message…')).toBeDisabled();
  });
});

