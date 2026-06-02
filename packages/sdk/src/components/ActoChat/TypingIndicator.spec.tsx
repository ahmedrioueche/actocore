import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActocoreProvider } from '../../provider/actocore-provider';
import { TypingIndicator } from './TypingIndicator';

describe('TypingIndicator', () => {
  it('renders accessible thinking status', () => {
    render(
      <ActocoreProvider apiKey="test-key" i18n={{ locale: 'en' }}>
        <TypingIndicator />
      </ActocoreProvider>,
    );

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Thinking…')).toBeTruthy();
    expect(document.querySelector('.ac-chat__typing-cloud')).toBeTruthy();
  });
});
