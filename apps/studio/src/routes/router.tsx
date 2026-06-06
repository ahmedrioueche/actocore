import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';

import StudioLayout from '@/components/layout/StudioLayout';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import AuthCallbackPage from '@/pages/auth/AuthCallbackPage';
import BillingPage from '@/pages/billing/BillingPage';
import OnboardingPage from '@/pages/onboarding/OnboardingPage';
import ProjectOverviewPage from '@/pages/projects/ProjectOverviewPage';
import ProjectApiKeysPage from '@/pages/projects/ProjectApiKeysPage';
import ProjectSectionPage from '@/pages/projects/ProjectSectionPage';
import ProjectsPage from '@/pages/projects/ProjectsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import TeamPage from '@/pages/team/TeamPage';
import NotFoundPage from '@/pages/system/NotFoundPage';
import {
  redirectIfAuthenticated,
  requireOnboardingPending,
  requireProjectAccessSync,
  requireStudioSession,
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

const studioLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'studio',
  beforeLoad: requireStudioSession,
  component: StudioLayout,
});

const projectsRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/projects',
  component: ProjectsPage,
});

const projectOverviewRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/projects/$projectId',
  beforeLoad: ({ params }) => requireProjectAccessSync(params.projectId),
  component: ProjectOverviewPage,
});

const projectKnowledgeRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/projects/$projectId/knowledge',
  beforeLoad: ({ params }) => requireProjectAccessSync(params.projectId),
  component: () => <ProjectSectionPage section="knowledge" />,
});

const projectActionsRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/projects/$projectId/actions',
  beforeLoad: ({ params }) => requireProjectAccessSync(params.projectId),
  component: () => <ProjectSectionPage section="actions" />,
});

const projectSdkConfigRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/projects/$projectId/sdk-config',
  beforeLoad: ({ params }) => requireProjectAccessSync(params.projectId),
  component: () => <ProjectSectionPage section="sdk-config" />,
});

const projectApiKeysRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/projects/$projectId/api-keys',
  beforeLoad: ({ params }) => requireProjectAccessSync(params.projectId),
  component: ProjectApiKeysPage,
});

const projectUsageRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/projects/$projectId/usage',
  beforeLoad: ({ params }) => requireProjectAccessSync(params.projectId),
  component: () => <ProjectSectionPage section="usage" />,
});

const teamRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/team',
  component: TeamPage,
});

const billingRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/billing',
  component: BillingPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/settings',
  component: SettingsPage,
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
  studioLayoutRoute.addChildren([
    projectsRoute,
    projectOverviewRoute,
    projectKnowledgeRoute,
    projectActionsRoute,
    projectSdkConfigRoute,
    projectApiKeysRoute,
    projectUsageRoute,
    teamRoute,
    billingRoute,
    settingsRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 30_000,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
