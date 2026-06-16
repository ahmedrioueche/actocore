const STORAGE_KEY = 'actocore.signup.planIntent';

export type SignupPlanIntent = {
  planId: string;
  cycle: 'monthly' | 'yearly';
};

export function saveSignupPlanIntent(intent: SignupPlanIntent): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
}

export function readSignupPlanIntent(): SignupPlanIntent | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SignupPlanIntent;
    if (!parsed?.planId || (parsed.cycle !== 'monthly' && parsed.cycle !== 'yearly')) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSignupPlanIntent(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** After signup/login, send paid-plan visitors to subscription checkout. */
export function resolveSignupPlanRedirect(): string | null {
  const intent = readSignupPlanIntent();
  if (!intent || intent.planId === 'free') {
    return null;
  }
  clearSignupPlanIntent();
  return '/subscription?scrollTo=plans';
}

export function parseSignupPlanSearch(search: Record<string, unknown>): SignupPlanIntent | null {
  const planId = typeof search.plan === 'string' ? search.plan.trim() : '';
  if (!planId || planId === 'free') {
    return null;
  }

  const cycle = search.cycle === 'yearly' ? 'yearly' : 'monthly';
  return { planId, cycle };
}
