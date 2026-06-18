import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import type { StudioProductTourStep } from '@ahmedrioueche/actocore-shared';
import {
  getProductTourStepsToAutoComplete,
  isStudioTestAccountEmail,
} from '@ahmedrioueche/actocore-shared';

import { useAuth } from '@/context/AuthContext';
import { markDemoProductTourSeen } from '@/lib/demo-product-tour';
import {
  useProductTourState,
  useUpdateProductTour,
} from '@/hooks/use-product-tour';
import { parseProjectIdFromPath } from '@/constants/navigation';
import {
  getProductTourNavigateTarget,
  isProductTourStepSatisfiedByPath,
  isProductTourStepVisibleOnPath,
} from '@/lib/product-tour-paths';

import { Coachmark } from './Coachmark';

type AnchorEntry = {
  element: HTMLElement;
};

type ProductTourContextValue = {
  activeStep: StudioProductTourStep | null;
  registerAnchor: (step: StudioProductTourStep, element: HTMLElement | null) => void;
  isStepActive: (step: StudioProductTourStep) => boolean;
};

const ProductTourContext = createContext<ProductTourContextValue | null>(null);

export function useProductTourContext(): ProductTourContextValue {
  const ctx = useContext(ProductTourContext);
  if (!ctx) {
    throw new Error('useProductTourContext must be used within ProductTourProvider');
  }
  return ctx;
}

export function useOptionalProductTourContext(): ProductTourContextValue | null {
  return useContext(ProductTourContext);
}

type ProductTourProviderProps = {
  children: ReactNode;
};

export function ProductTourProvider({ children }: ProductTourProviderProps) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const tourQuery = useProductTourState();
  const updateTour = useUpdateProductTour();
  const anchorsRef = useRef<Map<StudioProductTourStep, AnchorEntry>>(new Map());
  const [anchorVersion, setAnchorVersion] = useState(0);
  const syncedInaccessibleRef = useRef<string | null>(null);
  const routeCompletedRef = useRef<string | null>(null);
  const navigatedRef = useRef<string | null>(null);
  const prevActiveStepRef = useRef<StudioProductTourStep | null>(null);

  const permissions = session?.permissions ?? [];
  const demoEmail = session?.user.email;
  const isDemoSession = Boolean(
    demoEmail &&
      isStudioTestAccountEmail(demoEmail) &&
      session?.testAccountLease,
  );
  const tourState = tourQuery.data;
  const activeStep = tourState?.activeStep ?? null;

  const registerAnchor = useCallback(
    (step: StudioProductTourStep, element: HTMLElement | null) => {
      if (!element) {
        anchorsRef.current.delete(step);
      } else {
        anchorsRef.current.set(step, { element });
      }
      setAnchorVersion((value) => value + 1);
    },
    [],
  );

  const isStepActive = useCallback(
    (step: StudioProductTourStep) => activeStep === step,
    [activeStep],
  );

  const completeStep = useCallback(
    (step: StudioProductTourStep) => {
      if (!tourState?.eligible || tourState.dismissed) {
        return;
      }
      void updateTour.mutateAsync({ completeStep: step });
    },
    [tourState?.dismissed, tourState?.eligible, updateTour],
  );

  const dismissTour = useCallback(() => {
    if (isDemoSession && demoEmail) {
      markDemoProductTourSeen(demoEmail);
    }
    void updateTour.mutateAsync({ dismiss: true });
  }, [demoEmail, isDemoSession, updateTour]);

  useEffect(() => {
    if (!tourState?.eligible || tourState.dismissed) {
      return;
    }

    const inaccessible = getProductTourStepsToAutoComplete(
      tourState.completedSteps,
      permissions,
    );
    const key = inaccessible.join(',');
    if (inaccessible.length === 0 || syncedInaccessibleRef.current === key) {
      return;
    }

    syncedInaccessibleRef.current = key;
    void updateTour.mutateAsync({ completeSteps: inaccessible });
  }, [permissions, tourState, updateTour]);

  useEffect(() => {
    if (!activeStep) {
      routeCompletedRef.current = null;
      navigatedRef.current = null;
      return;
    }

    if (activeStep !== 'open_project') {
      return;
    }

    if (!isProductTourStepVisibleOnPath(activeStep, pathname)) {
      return;
    }

    if (!isProductTourStepSatisfiedByPath(activeStep, pathname)) {
      return;
    }

    const key = `${activeStep}:${pathname}`;
    if (routeCompletedRef.current === key) {
      return;
    }

    routeCompletedRef.current = key;
    void updateTour.mutateAsync({ completeStep: activeStep });
  }, [activeStep, pathname, updateTour]);

  useEffect(() => {
    if (!activeStep || activeStep === 'open_project') {
      navigatedRef.current = null;
      return;
    }

    if (!tourState?.eligible || tourState.dismissed) {
      return;
    }

    if (isProductTourStepSatisfiedByPath(activeStep, pathname)) {
      navigatedRef.current = null;
      return;
    }

    const projectId =
      parseProjectIdFromPath(pathname) ?? session?.projectIds[0] ?? null;
    if (!projectId) {
      return;
    }

    const target = getProductTourNavigateTarget(projectId, activeStep);
    if (!target) {
      return;
    }

    const key = `${activeStep}:${pathname}`;
    if (navigatedRef.current === key) {
      return;
    }

    navigatedRef.current = key;
    void navigate({ to: target.to, params: target.params });
  }, [
    activeStep,
    navigate,
    pathname,
    session?.projectIds,
    tourState?.dismissed,
    tourState?.eligible,
  ]);

  useEffect(() => {
    const previousStep = prevActiveStepRef.current;
    prevActiveStepRef.current = activeStep;

    if (
      !previousStep ||
      activeStep ||
      !tourState?.eligible ||
      tourState.dismissed
    ) {
      return;
    }

    if (isDemoSession && demoEmail) {
      markDemoProductTourSeen(demoEmail);
    }

    const projectId =
      parseProjectIdFromPath(pathname) ?? session?.projectIds[0] ?? null;
    if (!projectId) {
      return;
    }

    void navigate({ to: '/projects/$projectId', params: { projectId } });
  }, [
    activeStep,
    demoEmail,
    isDemoSession,
    navigate,
    pathname,
    session?.projectIds,
    tourState?.dismissed,
    tourState?.eligible,
  ]);

  const contextValue = useMemo(
    () => ({
      activeStep,
      registerAnchor,
      isStepActive,
    }),
    [activeStep, isStepActive, registerAnchor],
  );

  const anchorElement = activeStep
    ? anchorsRef.current.get(activeStep)?.element ?? null
    : null;

  const showCoachmark =
    Boolean(activeStep) &&
    Boolean(anchorElement) &&
    isProductTourStepVisibleOnPath(activeStep!, pathname);

  const isLastStep = activeStep === 'sdk_config';

  return (
    <ProductTourContext.Provider value={contextValue}>
      {children}
      {showCoachmark && activeStep && anchorElement ? (
        <Coachmark
          step={activeStep}
          anchor={anchorElement}
          anchorVersion={anchorVersion}
          isLastStep={isLastStep}
          isPending={updateTour.isPending}
          onNext={() => completeStep(activeStep)}
          onDismiss={dismissTour}
        />
      ) : null}
    </ProductTourContext.Provider>
  );
}
