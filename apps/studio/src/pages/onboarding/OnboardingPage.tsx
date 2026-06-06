import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import InputField from '@/components/ui/InputField';
import Loading from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import {
  useCompleteOnboardingStep,
  useCreateOnboardingProject,
  useOnboardingState,
  useSkipOnboarding,
  useUpdateWorkspaceSettings,
} from '@/hooks/use-onboarding';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, isLoading: authLoading } = useAuth();
  const stateQuery = useOnboardingState();
  const completeStep = useCompleteOnboardingStep();
  const skipOnboarding = useSkipOnboarding();
  const updateWorkspace = useUpdateWorkspaceSettings();
  const createProject = useCreateOnboardingProject();

  const [workspaceName, setWorkspaceName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [defaultLocale, setDefaultLocale] = useState('en');
  const [projectName, setProjectName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.account.name) {
      setWorkspaceName(session.account.name);
    }
    if (session?.account.timezone) {
      setTimezone(session.account.timezone);
    }
    if (session?.account.defaultLocale) {
      setDefaultLocale(session.account.defaultLocale);
    }
  }, [session?.account]);

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

  const state = stateQuery.data;
  const currentStep = state?.currentStep ?? 'welcome';
  const isBusy =
    completeStep.isPending ||
    skipOnboarding.isPending ||
    updateWorkspace.isPending ||
    createProject.isPending;

  const goToProjects = () => {
    void navigate({ to: '/projects' });
  };

  const handleError = (err: unknown) => {
    const code = (err as Error & { errorCode?: string }).errorCode;
    setFormError(
      getApiErrorMessage(t, {
        errorCode: code,
        message: err instanceof Error ? err.message : undefined,
      }),
    );
  };

  const finishWelcome = async () => {
    setFormError(null);
    try {
      await completeStep.mutateAsync('welcome');
    } catch (err) {
      handleError(err);
    }
  };

  const finishWorkspace = async () => {
    setFormError(null);
    const name = workspaceName.trim();
    if (!name) {
      setFormError(t('onboarding.workspace.nameRequired'));
      return;
    }
    try {
      await updateWorkspace.mutateAsync({
        name,
        timezone: timezone.trim() || undefined,
        defaultLocale: defaultLocale.trim() || undefined,
      });
      await completeStep.mutateAsync('workspace');
    } catch (err) {
      handleError(err);
    }
  };

  const finishProject = async () => {
    setFormError(null);
    const name = projectName.trim();
    if (!name) {
      setFormError(t('onboarding.project.nameRequired'));
      return;
    }
    try {
      await createProject.mutateAsync(name);
      await completeStep.mutateAsync('project');
      goToProjects();
    } catch (err) {
      handleError(err);
    }
  };

  const handleSkip = async () => {
    setFormError(null);
    try {
      await skipOnboarding.mutateAsync();
      goToProjects();
    } catch (err) {
      handleError(err);
    }
  };

  if (stateQuery.isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading fullScreen={false} />
      </div>
    );
  }

  if (stateQuery.isError || !state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-4">
        <p className="text-text-secondary">{t('common.error')}</p>
        <Button type="button" onClick={() => void stateQuery.refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  if (currentStep === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading fullScreen={false} />
      </div>
    );
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      onSkip={handleSkip}
      skipPending={skipOnboarding.isPending}
    >
      {currentStep === 'welcome' ? (
        <section className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {t('onboarding.welcome.title')}
            </h1>
            <p className="mt-2 text-text-secondary">
              {t('onboarding.welcome.subtitle')}
            </p>
          </div>
          <ul className="space-y-3 text-sm text-text-secondary list-disc pl-5">
            <li>{t('onboarding.welcome.pointProjects')}</li>
            <li>{t('onboarding.welcome.pointKnowledge')}</li>
            <li>{t('onboarding.welcome.pointSdk')}</li>
          </ul>
          {formError ? (
            <p className="text-sm text-danger" role="alert">
              {formError}
            </p>
          ) : null}
          <Button
            type="button"
            onClick={() => void finishWelcome()}
            disabled={isBusy}
            className="w-full"
          >
            {t('onboarding.welcome.cta')}
          </Button>
        </section>
      ) : null}

      {currentStep === 'workspace' ? (
        <section className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {t('onboarding.workspace.title')}
            </h1>
            <p className="mt-2 text-text-secondary">
              {t('onboarding.workspace.subtitle')}
            </p>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void finishWorkspace();
            }}
          >
            <InputField
              label={t('onboarding.workspace.name')}
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              required
            />
            <InputField
              label={t('onboarding.workspace.timezone')}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder={t('onboarding.workspace.timezonePlaceholder')}
            />
            <InputField
              label={t('onboarding.workspace.locale')}
              value={defaultLocale}
              onChange={(e) => setDefaultLocale(e.target.value)}
              placeholder="en"
            />
            {formError ? (
              <p className="text-sm text-danger" role="alert">
                {formError}
              </p>
            ) : null}
            <Button type="submit" disabled={isBusy} className="w-full">
              {t('common.continue')}
            </Button>
          </form>
        </section>
      ) : null}

      {currentStep === 'project' ? (
        <section className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {t('onboarding.project.title')}
            </h1>
            <p className="mt-2 text-text-secondary">
              {t('onboarding.project.subtitle')}
            </p>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void finishProject();
            }}
          >
            <InputField
              label={t('onboarding.project.name')}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t('onboarding.project.namePlaceholder')}
              required
            />
            {formError ? (
              <p className="text-sm text-danger" role="alert">
                {formError}
              </p>
            ) : null}
            <Button type="submit" disabled={isBusy} className="w-full">
              {t('onboarding.project.cta')}
            </Button>
          </form>
        </section>
      ) : null}
    </OnboardingLayout>
  );
}
