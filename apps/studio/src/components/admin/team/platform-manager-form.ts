import {
  ALL_PLATFORM_PERMISSIONS,
  type PlatformManagerData,
  type PlatformPermission,
} from '@ahmedrioueche/actocore-shared';
import type { TFunction } from 'i18next';

import { isValidPlatformUsername } from '@/utils/platform-username';

export interface PlatformManagerFormState {
  username: string;
  password: string;
  displayName: string;
  permissions: PlatformPermission[];
}

export interface PlatformManagerFieldErrors {
  username?: string;
  password?: string;
}

export interface PlatformManagerValidationResult {
  fieldErrors: PlatformManagerFieldErrors;
  formError?: string;
}

export function validatePlatformManagerForm(
  form: PlatformManagerFormState,
  t: TFunction,
): PlatformManagerValidationResult {
  const fieldErrors: PlatformManagerFieldErrors = {};
  const username = form.username.trim();

  if (!username) {
    fieldErrors.username = t('admin.team.errors.usernameRequired');
  } else if (!isValidPlatformUsername(username)) {
    fieldErrors.username = t('admin.team.errors.usernameFormat');
  }

  if (form.password.length < 8) {
    fieldErrors.password = t('admin.team.errors.passwordRequired');
  }

  if (form.permissions.length === 0) {
    return {
      fieldErrors,
      formError: t('admin.team.errors.permissionsRequired'),
    };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return { fieldErrors };
}

export function validatePlatformManagerEditForm(
  form: PlatformManagerFormState,
  t: TFunction,
): PlatformManagerValidationResult {
  const fieldErrors: PlatformManagerFieldErrors = {};

  if (form.password.length > 0 && form.password.length < 8) {
    fieldErrors.password = t('admin.team.errors.passwordRequired');
  }

  if (form.permissions.length === 0) {
    return {
      fieldErrors,
      formError: t('admin.team.errors.permissionsRequired'),
    };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return { fieldErrors };
}

export function managerToFormState(
  manager: PlatformManagerData,
): PlatformManagerFormState {
  return {
    username: manager.username,
    password: '',
    displayName: manager.displayName ?? '',
    permissions: [...manager.permissions],
  };
}

export function resolvePlatformManagerApiError(
  err: unknown,
  t: TFunction,
  action: 'create' | 'update' = 'create',
): PlatformManagerValidationResult & { toastMessage: string } {
  const apiErr = err as Error & { errorCode?: string };
  const message =
    apiErr instanceof Error
      ? apiErr.message
      : err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: string }).message ?? '')
        : t('errors.generic');

  const toastMessage =
    apiErr.errorCode === 'USER_ALREADY_EXISTS'
      ? t('admin.team.errors.usernameTaken')
      : apiErr.errorCode === 'INTERNAL_ERROR'
        ? action === 'update'
          ? t('admin.team.errors.updateFailed')
          : t('admin.team.errors.createFailed')
        : message || t('errors.generic');

  const lower = message.toLowerCase();
  if (
    lower.includes('username') ||
    apiErr.errorCode === 'USER_ALREADY_EXISTS'
  ) {
    return {
      fieldErrors: { username: toastMessage },
      toastMessage,
    };
  }
  if (lower.includes('password')) {
    return {
      fieldErrors: { password: toastMessage },
      toastMessage,
    };
  }

  return { fieldErrors: {}, formError: toastMessage, toastMessage };
}

export function defaultPlatformManagerFormState(): PlatformManagerFormState {
  return {
    username: '',
    password: '',
    displayName: '',
    permissions: [ALL_PLATFORM_PERMISSIONS[0]],
  };
}

export const PLATFORM_PERMISSION_LABEL_KEYS: Record<PlatformPermission, string> =
  {
    'platform.accounts.read': 'admin.team.permissionLabels.accountsRead',
    'platform.plans.write': 'admin.team.permissionLabels.plansWrite',
    'platform.subscriptions.read': 'admin.team.permissionLabels.subscriptionsRead',
    'platform.users.read': 'admin.team.permissionLabels.usersRead',
    'platform.projects.read': 'admin.team.permissionLabels.projectsRead',
    'platform.analytics.read': 'admin.team.permissionLabels.analyticsRead',
    'platform.team.write': 'admin.team.permissionLabels.teamWrite',
    'platform.settings.write': 'admin.team.permissionLabels.settingsWrite',
  };
