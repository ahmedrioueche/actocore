import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';

import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import AuthCallbackPage from '@/pages/auth/AuthCallbackPage';
import ProjectsPlaceholderPage from '@/pages/projects/ProjectsPlaceholderPage';
import OnboardingPage from '@/pages/onboarding/OnboardingPage';
import LoadingPage from '@/pages/system/LoadingPage';
import NotFoundPage from '@/pages/system/NotFoundPage';
import {
  redirectIfAuthenticated,
  requireAuth,
  requireOnboardingComplete,
  requireOnboardingPending,
} from '@/routes/guards';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/projects' });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: redirectIfAuthenticated,
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  beforeLoad: redirectIfAuthenticated,
  component: SignupPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  beforeLoad: redirectIfAuthenticated,
  component: ForgotPasswordPage,
});

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/verify-email',
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: VerifyEmailPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/reset-password',
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordPage,
});

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === 'string' ? search.code : undefined,
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
  component: AuthCallbackPage,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  beforeLoad: requireOnboardingPending,
  component: OnboardingPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects',
  beforeLoad: requireOnboardingComplete,
  pendingComponent: () => <LoadingPage type="inner" />,
  component: ProjectsPlaceholderPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  forgotPasswordRoute,
  verifyEmailRoute,
  resetPasswordRoute,
  authCallbackRoute,
  onboardingRoute,
  projectsRoute,
]);

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
  defaultPendingComponent: () => <LoadingPage type="inner" />,
  defaultPendingMs: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
