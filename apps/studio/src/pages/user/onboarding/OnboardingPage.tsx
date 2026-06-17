import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { OnboardingLayout, OnboardingShell } from '@/components/onboarding/OnboardingLayout';
import { OnboardingLocaleSelect } from '@/components/onboarding/OnboardingLocaleSelect';
import { OnboardingStepPanel } from '@/components/onboarding/OnboardingStepPanel';
import { OnboardingWelcomeFeatures } from '@/components/onboarding/OnboardingWelcomeFeatures';
import { AsyncContent, PageSkeleton } from '@/components/states';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import {
  accountLocaleToStudioLanguage,
  applyStudioLanguage,
  studioLanguageToAccountLocale,
  type StudioLanguage,
} from '@/constants/languages';
import { useAuth } from '@/context/AuthContext';
import {
  useCompleteOnboardingStep,
  useCreateOnboardingProject,
  useOnboardingProjects,
  useOnboardingState,
  useRenameOnboardingProject,
  useSkipOnboarding,
  useUpdateWorkspaceSettings,
} from '@/hooks/use-onboarding';
import { getApiErrorMessage } from '@/utils/statusMessage';
import { toast } from '@/stores/toast';

export default function OnboardingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { session, isLoading: authLoading } = useAuth();
  const stateQuery = useOnboardingState();
  const completeStep = useCompleteOnboardingStep();
  const skipOnboarding = useSkipOnboarding();
  const updateWorkspace = useUpdateWorkspaceSettings();
  const createProject = useCreateOnboardingProject();
  const renameProject = useRenameOnboardingProject();

  const state = stateQuery.data;
  const currentStep = state?.currentStep ?? 'welcome';
  const projectsQuery = useOnboardingProjects(currentStep === 'project');

  const [workspaceName, setWorkspaceName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [uiLanguage, setUiLanguage] = useState<StudioLanguage>('en');
  const [projectName, setProjectName] = useState('');
  const [existingProjectId, setExistingProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.account.name) {
      setWorkspaceName(session.account.name);
    }
    if (session?.account.timezone) {
      setTimezone(session.account.timezone);
    }
    if (session?.account.defaultLocale) {
      setUiLanguage(accountLocaleToStudioLanguage(session.account.defaultLocale));
    }
  }, [session?.account]);

  useEffect(() => {
    if (currentStep !== 'project' || !projectsQuery.data?.length) {
      return;
    }
    const first = projectsQuery.data[0]!;
    setExistingProjectId(first.id);
    setProjectName((prev) => (prev.trim() ? prev : first.name));
  }, [currentStep, projectsQuery.data]);

  useEffect(() => {
    if (
      stateQuery.data &&
      (stateQuery.data.currentStep === 'done' ||
        !stateQuery.data.required ||
        stateQuery.data.completed)
    ) {
      void navigate({ to: '/projects' });
    }
  }, [stateQuery.data, navigate]);

  const isBusy =
    completeStep.isPending ||
    skipOnboarding.isPending ||
    updateWorkspace.isPending ||
    createProject.isPending ||
    renameProject.isPending;

  const goToProjects = () => {
    void navigate({ to: '/projects' });
  };

  const handleError = (err: unknown) => {
    const code = (err as Error & { errorCode?: string }).errorCode;
    toast.error(
      getApiErrorMessage(t, {
        errorCode: code,
        message: err instanceof Error ? err.message : undefined,
      }),
    );
  };

  const finishWelcome = async () => {
    try {
      await completeStep.mutateAsync('welcome');
    } catch (err) {
      handleError(err);
    }
  };

  const finishWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = workspaceName.trim();
    if (!name) {
      toast.error(t('onboarding.workspace.nameRequired'));
      return;
    }
    try {
      await updateWorkspace.mutateAsync({
        name,
        timezone: timezone.trim() || undefined,
        defaultLocale: studioLanguageToAccountLocale(uiLanguage),
      });
      applyStudioLanguage(uiLanguage);
      void i18n.changeLanguage(uiLanguage);
      await completeStep.mutateAsync('workspace');
    } catch (err) {
      handleError(err);
    }
  };

  const finishProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = projectName.trim();
    if (!name) {
      toast.error(t('onboarding.project.nameRequired'));
      return;
    }
    try {
      if (existingProjectId) {
        await renameProject.mutateAsync({ projectId: existingProjectId, name });
      } else {
        await createProject.mutateAsync(name);
      }
      await completeStep.mutateAsync('project');
      goToProjects();
    } catch (err) {
      handleError(err);
    }
  };

  const handleSkip = async () => {
    try {
      await skipOnboarding.mutateAsync();
      goToProjects();
    } catch (err) {
      handleError(err);
    }
  };

  if (stateQuery.isLoading || authLoading) {
    return (
      <OnboardingShell>
        <PageSkeleton variant="form" showHeader={false} />
      </OnboardingShell>
    );
  }

  if (stateQuery.isError || !state) {
    return (
      <OnboardingShell>
        <AsyncContent
          isError
          onRetry={() => void stateQuery.refetch()}
        />
      </OnboardingShell>
    );
  }

  if (currentStep === 'done') {
    return (
      <OnboardingShell>
        <PageSkeleton variant="form" showHeader={false} />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      onSkip={handleSkip}
      skipPending={skipOnboarding.isPending}
    >
      {currentStep === 'welcome' ? (
        <OnboardingStepPanel
          title={t('onboarding.welcome.title')}
          subtitle={t('onboarding.welcome.subtitle')}
        >
          <div className="space-y-6">
            <OnboardingWelcomeFeatures />
            <AuthPrimaryButton
              type="button"
              loading={isBusy}
              onClick={() => void finishWelcome()}
            >
              {t('onboarding.welcome.cta')}
            </AuthPrimaryButton>
          </div>
        </OnboardingStepPanel>
      ) : null}

      {currentStep === 'workspace' ? (
        <OnboardingStepPanel
          title={t('onboarding.workspace.title')}
          subtitle={t('onboarding.workspace.subtitle')}
        >
          <form className="space-y-5" onSubmit={finishWorkspace}>
            <InputField
              label={t('onboarding.workspace.name')}
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder={t('onboarding.workspace.namePlaceholder')}
              required
            />
            <InputField
              label={t('onboarding.workspace.timezone')}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder={t('onboarding.workspace.timezonePlaceholder')}
            />
            <OnboardingLocaleSelect
              value={uiLanguage}
              onChange={setUiLanguage}
            />
            <AuthPrimaryButton type="submit" loading={isBusy}>
              {t('common.continue')}
            </AuthPrimaryButton>
          </form>
        </OnboardingStepPanel>
      ) : null}

      {currentStep === 'project' ? (
        <OnboardingStepPanel
          title={t('onboarding.project.title')}
          subtitle={
            existingProjectId
              ? t('onboarding.project.subtitleRename')
              : t('onboarding.project.subtitle')
          }
        >
          <form className="space-y-5" onSubmit={finishProject}>
            <InputField
              label={t('onboarding.project.name')}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t('onboarding.project.namePlaceholder')}
              required
            />
            <AuthPrimaryButton type="submit" loading={isBusy}>
              {existingProjectId
                ? t('onboarding.project.ctaRename')
                : t('onboarding.project.cta')}
            </AuthPrimaryButton>
          </form>
        </OnboardingStepPanel>
      ) : null}
    </OnboardingLayout>
  );
}
