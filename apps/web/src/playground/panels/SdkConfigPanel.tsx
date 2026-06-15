import { useTranslation } from 'react-i18next';

import { SdkConfigForm } from '@/components/sdk-config/SdkConfigForm';
import { Checkbox } from '@/components/ui';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { useT } from '@/i18n/useT';
import type { SdkConfigFormState } from '@/utils/sdk-config-form';

import type { PlaygroundActionDefinition, PlaygroundSdkExtras } from '../types';

type SdkConfigPanelProps = {
  form: SdkConfigFormState;
  extras: PlaygroundSdkExtras;
  actions: PlaygroundActionDefinition[];
  busy?: boolean;
  onFormChange: (form: SdkConfigFormState) => void;
  onExtrasChange: (extras: PlaygroundSdkExtras) => void;
};

export function SdkConfigPanel({
  form,
  extras,
  actions,
  busy = false,
  onFormChange,
  onExtrasChange,
}: SdkConfigPanelProps) {
  const { t } = useT('playground.sdkConfig');
  const { t: tSdk } = useTranslation();

  function patchExtras(partial: Partial<PlaygroundSdkExtras>) {
    onExtrasChange({ ...extras, ...partial });
  }

  function toggleAllowedAction(name: string, enabled: boolean) {
    const next = enabled
      ? [...new Set([...extras.allowedActionNames, name])]
      : extras.allowedActionNames.filter((item) => item !== name);

    patchExtras({ allowedActionNames: next });
  }

  const defaultToggleHint = (enabled: boolean) =>
    tSdk(enabled ? 'sdkConfig.fields.defaultOn' : 'sdkConfig.fields.defaultOff');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-text-primary">{t('title')}</h2>
        <p className="text-sm text-text-secondary">{t('description')}</p>
      </div>

      <SdkConfigForm value={form} onChange={onFormChange} disabled={busy} />

      <section className="space-y-4 rounded-2xl border border-border bg-surface-secondary/40 p-5">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            {t('sections.securityVoice.title')}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {t('sections.securityVoice.description')}
          </p>
        </div>

        <ToggleSwitch
          checked={extras.enforceActionAllowlist}
          onChange={(enforceActionAllowlist) => patchExtras({ enforceActionAllowlist })}
          disabled={busy}
          label={t('fields.enforceAllowlist')}
        />
        <ToggleSwitch
          checked={extras.voiceInput}
          onChange={(voiceInput) => patchExtras({ voiceInput })}
          disabled={busy}
          label={t('fields.voiceInput')}
          description={defaultToggleHint(false)}
        />
        <ToggleSwitch
          checked={extras.voiceOutput}
          onChange={(voiceOutput) => patchExtras({ voiceOutput })}
          disabled={busy}
          label={t('fields.voiceOutput')}
          description={defaultToggleHint(false)}
        />

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('fields.allowedActions')}
          </p>
          <div className="flex flex-col gap-2">
            {actions.map((action) => (
              <Checkbox
                key={action.name}
                id={`playground-allow-${action.name}`}
                variant="inline"
                checked={extras.allowedActionNames.includes(action.name)}
                onChange={(checked) => toggleAllowedAction(action.name, checked)}
                disabled={busy}
                label={<code>{action.name}</code>}
              />
            ))}
          </div>
        </div>
      </section>

      <p className="text-xs text-muted">{t('footnote')}</p>
    </div>
  );
}
