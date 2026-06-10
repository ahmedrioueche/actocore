import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';

import StudioLayout from '@/components/layout/StudioLayout';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminAccountDetailPage from '@/pages/admin/accounts/AccountDetailPage';
import AdminAccountsPage from '@/pages/admin/accounts/AccountsPage';
import AdminAnalyticsPage from '@/pages/admin/analytics/AnalyticsPage';
import AdminUsagePage from '@/pages/admin/usage/UsagePage';
import AdminDashboardPage from '@/pages/admin/dashboard/DashboardPage';
import AdminLoginPage from '@/pages/admin/login/LoginPage';
import AdminPlansPage from '@/pages/admin/plans/PlansPage';
import AdminProjectsPage from '@/pages/admin/projects/ProjectsPage';
import AdminSettingsPage from '@/pages/admin/settings/SettingsPage';
import AdminSubscriptionsPage from '@/pages/admin/subscriptions/SubscriptionsPage';
import AdminTeamPage from '@/pages/admin/team/TeamPage';
import AdminUsersPage from '@/pages/admin/users/UsersPage';
import AuthCallbackPage from '@/pages/user/auth/AuthCallbackPage';
import ForgotPasswordPage from '@/pages/user/auth/ForgotPasswordPage';
import LoginPage from '@/pages/user/auth/LoginPage';
import ResetPasswordPage from '@/pages/user/auth/ResetPasswordPage';
import SignupPage from '@/pages/user/auth/SignupPage';
import VerifyEmailPage from '@/pages/user/auth/VerifyEmailPage';
import BillingPage from '@/pages/user/billing/BillingPage';
import OnboardingPage from '@/pages/user/onboarding/OnboardingPage';
import ProjectActionsPage from '@/pages/user/projects/ProjectActionsPage';
import ProjectApiKeysPage from '@/pages/user/projects/ProjectApiKeysPage';
import ProjectDocsPage from '@/pages/user/projects/ProjectDocsPage';
import ProjectOverviewPage from '@/pages/user/projects/ProjectOverviewPage';
import ProjectKnowledgePage from '@/pages/user/projects/ProjectKnowledgePage';
import ProjectSdkConfigPage from '@/pages/user/projects/ProjectSdkConfigPage';
import ProjectSettingsPage from '@/pages/user/projects/ProjectSettingsPage';
import ProjectUsagePage from '@/pages/user/projects/ProjectUsagePage';
import WorkspaceUsagePage from '@/pages/user/usage/WorkspaceUsagePage';
import ProjectsPage from '@/pages/user/projects/ProjectsPage';
import SettingsPage from '@/pages/user/settings/SettingsPage';
import SubscriptionPage from '@/pages/user/subscription/SubscriptionPage';
import TeamPage from '@/pages/user/team/TeamPage';
import NotFoundPage from '@/pages/system/NotFoundPage';
import {
  redirectIfPlatformAuthenticated,
  requirePlatformAnalyticsAccess,
  requirePlatformSession,
} from '@/routes/admin-guards';
import {
  redirectIfAuthenticated,
  redirectPlatformOperatorFromTenantWorkspace,
  requireOnboardingPending,
  requireProjectAccessSync,
  requireStudioSession,
  resolveAuthenticatedHomePath,
} from '@/routes/guards';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: resolveAuthenticatedHomePath() });
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
  beforeLoad: () => {
    requireStudioSession();
    redirectPlatformOperatorFromTenantWorkspace();
  },
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

const projectDocsRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/projects/$projectId/docs',
  beforeLoad: ({ params }) => requireProjectAccessSync(params.projectId),
  component: ProjectDocsPage,
});

const projectKnowledgeRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/projects/$projectId/knowledge',
  beforeLoad: ({ params }) => requireProjectAccessSync(params.projectId),
  component: ProjectKnowledgePage,
});

const projectActionsRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/projects/$projectId/actions',
  beforeLoad: ({ params }) => requireProjectAccessSync(params.projectId),
  component: ProjectActionsPage,
});

const projectSdkConfigRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/projects/$projectId/sdk-config',
  beforeLoad: ({ params }) => requireProjectAccessSync(params.projectId),
  component: ProjectSdkConfigPage,
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
  component: ProjectUsagePage,
});

const workspaceUsageRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/usage',
  component: WorkspaceUsagePage,
});

const projectSettingsRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/projects/$projectId/settings',
  beforeLoad: ({ params }) => requireProjectAccessSync(params.projectId),
  component: ProjectSettingsPage,
});

const teamRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/team',
  component: TeamPage,
});

const subscriptionRoute = createRoute({
  getParentRoute: () => studioLayoutRoute,
  path: '/subscription',
  validateSearch: (search: Record<string, unknown>) => ({
    subscriptionId:
      typeof search.subscriptionId === 'string'
        ? search.subscriptionId
        : typeof search.subscription_id === 'string'
          ? search.subscription_id
          : undefined,
    scrollTo: search.scrollTo === 'plans' ? ('plans' as const) : undefined,
  }),
  component: SubscriptionPage,
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

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/login',
  beforeLoad: redirectIfPlatformAuthenticated,
  component: AdminLoginPage,
});

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin',
  beforeLoad: requirePlatformSession,
  component: AdminLayout,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin',
  beforeLoad: requirePlatformAnalyticsAccess,
  component: AdminDashboardPage,
});

const adminAccountsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/accounts',
  component: AdminAccountsPage,
});

const adminAccountDetailRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/accounts/$accountId',
  component: AdminAccountDetailPage,
});

const adminPlansRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/plans',
  component: AdminPlansPage,
});

const adminTeamRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/team',
  component: AdminTeamPage,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/settings',
  component: AdminSettingsPage,
});

const adminSubscriptionsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/subscriptions',
  component: AdminSubscriptionsPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/users',
  component: AdminUsersPage,
});

const adminProjectsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/projects',
  component: AdminProjectsPage,
});

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/analytics',
  component: AdminAnalyticsPage,
});

const adminUsageRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/usage',
  component: AdminUsagePage,
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
  adminLoginRoute,
  adminLayoutRoute.addChildren([
    adminDashboardRoute,
    adminAccountsRoute,
    adminAccountDetailRoute,
    adminPlansRoute,
    adminTeamRoute,
    adminSettingsRoute,
    adminSubscriptionsRoute,
    adminUsersRoute,
    adminProjectsRoute,
    adminAnalyticsRoute,
    adminUsageRoute,
  ]),
  studioLayoutRoute.addChildren([
    projectsRoute,
    projectOverviewRoute,
    projectDocsRoute,
    projectKnowledgeRoute,
    projectActionsRoute,
    projectSdkConfigRoute,
    projectApiKeysRoute,
    projectUsageRoute,
    projectSettingsRoute,
    workspaceUsageRoute,
    teamRoute,
    subscriptionRoute,
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
