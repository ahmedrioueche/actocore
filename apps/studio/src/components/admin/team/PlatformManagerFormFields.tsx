import {
  ALL_PLATFORM_PERMISSIONS,
  type PlatformPermission,
} from '@ahmedrioueche/actocore-shared';
import { useTranslation } from 'react-i18next';

import {
  PLATFORM_PERMISSION_LABEL_KEYS,
  type PlatformManagerFieldErrors,
  type PlatformManagerFormState,
} from '@/components/admin/team/platform-manager-form';
import InputField from '@/components/ui/InputField';
import ToggleSwitch from '@/components/ui/ToggleSwitch';

interface PlatformManagerFormFieldsProps {
  form: PlatformManagerFormState;
  onChange: (form: PlatformManagerFormState) => void;
  mode?: 'create' | 'edit';
  fieldErrors?: PlatformManagerFieldErrors;
  formError?: string | null;
}

export function PlatformManagerFormFields({
  form,
  onChange,
  mode = 'create',
  fieldErrors,
  formError,
}: PlatformManagerFormFieldsProps) {
  const { t } = useTranslation();

  const togglePermission = (permission: PlatformPermission) => {
    const next = form.permissions.includes(permission)
      ? form.permissions.filter((item) => item !== permission)
      : [...form.permissions, permission];
    onChange({ ...form, permissions: next });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <InputField
            label={t('admin.team.username')}
            value={form.username}
            onChange={(e) => onChange({ ...form, username: e.target.value })}
            placeholder={t('admin.team.usernamePlaceholder')}
            error={fieldErrors?.username}
            disabled={mode === 'edit'}
            autoFocus={mode === 'create'}
          />
          {mode === 'create' ? (
            <p className="mt-1.5 text-xs text-text-secondary">
              {t('admin.team.usernameHint')}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-text-secondary">
              {t('admin.team.usernameLockedHint')}
            </p>
          )}
        </div>
        <InputField
          label={t('admin.team.displayName')}
          value={form.displayName}
          onChange={(e) => onChange({ ...form, displayName: e.target.value })}
          placeholder={t('admin.team.displayNamePlaceholder')}
        />
        <InputField
          label={
            mode === 'edit'
              ? t('admin.team.newPassword')
              : t('admin.team.password')
          }
          type="password"
          value={form.password}
          onChange={(e) => onChange({ ...form, password: e.target.value })}
          placeholder={
            mode === 'edit'
              ? t('admin.team.newPasswordPlaceholder')
              : t('admin.team.passwordPlaceholder')
          }
          error={fieldErrors?.password}
          className="md:col-span-2"
        />
      </div>

      <div className="rounded-xl border border-border bg-surface-secondary/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          {t('admin.team.permissions')}
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          {t('admin.team.permissionsHint')}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {ALL_PLATFORM_PERMISSIONS.map((permission) => (
            <ToggleSwitch
              key={permission}
              checked={form.permissions.includes(permission)}
              onChange={() => togglePermission(permission)}
              label={t(PLATFORM_PERMISSION_LABEL_KEYS[permission])}
            />
          ))}
        </div>
      </div>

      {formError ? (
        <p className="text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}
    </div>
  );
}
