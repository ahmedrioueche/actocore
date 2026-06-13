import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n';
import LoginPage from '@/pages/user/auth/LoginPage';

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
  useAvailableTestAccount: () => ({
    data: {
      account: {
        id: 'demoUser1',
        email: 'demo1@actocore.test',
        password: 'Demo123!',
        displayName: 'Demo User 1',
        accountName: 'Demo Workspace 1',
      },
    },
    isLoading: false,
    refetch: vi.fn(),
  }),
  useGoogleAuth: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/lib/feature-flags', () => ({
  isStudioFeatureEnabled: (flag: string) => flag === 'testAccounts',
  STUDIO_FEATURE_FLAGS: { testAccounts: 'testAccounts' },
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
    expect(
      screen.getByRole('button', { name: /^sign in$/i }),
    ).toBeInTheDocument();
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

  it('shows one available test account pre-selected on load', () => {
    renderLoginPage();
    expect(screen.getByText(/use a test account/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /^Demo User 1 Demo Workspace 1 Ready — click to sign in$/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveValue('demo1@actocore.test');
  });
});
