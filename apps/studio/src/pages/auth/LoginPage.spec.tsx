import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n';
import LoginPage from '@/pages/auth/LoginPage';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
  }: {
    children: React.ReactNode;
    to: string;
  }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

vi.mock('@/hooks/use-auth', () => ({
  useLogin: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useGoogleAuth: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

function renderLoginPage() {
  const queryClient = new QueryClient();
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('LoginPage', () => {
  it('renders email login by default', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument();
  });

  it('shows team member fields when toggled', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(
      screen.getByRole('button', { name: /sign in as a team member/i }),
    );

    expect(screen.getByLabelText(/workspace id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  });
});
