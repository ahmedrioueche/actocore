import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SdkConfigSection } from '@/components/sdk-config/SdkConfigSection';
import { SdkLabelLocaleTabs } from '@/components/sdk-config/SdkLabelLocaleTabs';
import { SdkSupportedLanguagesFields } from '@/components/sdk-config/SdkSupportedLanguagesFields';
import { DocsLearnMoreLink } from '@/components/projects/docs/DocsLearnMoreLink';
import Button from '@/components/ui/Button';
import Tip from '@/components/ui/Tip';
import {
  getBundledLabelDefault,
  syncLabelTextsByLocale,
  type SdkLabelTextField,
} from '@/constants/sdk-label-text';
import { useTranslateSdkCopy } from '@/hooks/use-sdk-config';
import { toast } from '@/stores/toast';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import type { SdkConfigFormState } from '@/utils/sdk-config-form';
import {
  applyTranslatedLabelsToForm,
  buildTranslateSourceLabels,
  getFormLabelTexts,
  resolveTranslateTargetLocales,
} from '@/utils/sdk-config-form';
import { findChatLocalePreset } from '@/constants/sdk-chat-locales';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

interface SdkConfigCopySectionProps {
  projectId: string;
  value: SdkConfigFormState;
  onChange: (value: SdkConfigFormState) => void;
  disabled?: boolean;
}

export function SdkConfigCopySection({
  projectId,
  value,
  onChange,
  disabled = false,
}: SdkConfigCopySectionProps) {
  const { t } = useTranslation();
  const translateCopy = useTranslateSdkCopy(projectId);
  const [activeLabelLocale, setActiveLabelLocale] = useState(value.defaultLocale);

  useEffect(() => {
    if (!value.supportedLocales.includes(activeLabelLocale)) {
      setActiveLabelLocale(value.defaultLocale);
    }
  }, [activeLabelLocale, value.defaultLocale, value.supportedLocales]);

  const targetLocales = useMemo(
    () => resolveTranslateTargetLocales(value, activeLabelLocale),
    [value, activeLabelLocale],
  );

  const resolveLocaleLabel = (code: string) => {
    const preset = findChatLocalePreset(code);
    return preset ? t(preset.labelKey) : code.toUpperCase();
  };

  const translateButtonLabel =
    activeLabelLocale !== value.defaultLocale
      ? t('sdkConfig.translate.toActiveLocale', {
          source: resolveLocaleLabel(value.defaultLocale),
          target: resolveLocaleLabel(activeLabelLocale),
        })
      : t('sdkConfig.translate.toOtherLocales', {
          source: resolveLocaleLabel(value.defaultLocale),
        });

  const translateButtonLabelShort =
    activeLabelLocale !== value.defaultLocale
      ? t('sdkConfig.translate.toActiveLocaleShort', {
          target: resolveLocaleLabel(activeLabelLocale),
        })
      : t('sdkConfig.translate.toOtherLocalesShort');

  const handleTranslate = async () => {
    const sourceLabels = buildTranslateSourceLabels(value, value.defaultLocale);
    if (Object.keys(sourceLabels).length === 0) {
      toast.error(t('sdkConfig.translate.noSourceLabels'));
      return;
    }

    try {
      const result = await translateCopy.mutateAsync({
        sourceLocale: value.defaultLocale,
        targetLocales,
        sourceLabels,
      });
      onChange(applyTranslatedLabelsToForm(value, result.translations));
      toast.success(t('sdkConfig.translate.success'));
    } catch (error) {
      toast.error(getUnknownApiErrorMessage(t, error));
    }
  };

  const patch = (partial: Partial<SdkConfigFormState>) => {
    onChange({ ...value, ...partial });
  };

  const activeLabels = getFormLabelTexts(value, activeLabelLocale);

  const patchLabelField = (field: SdkLabelTextField, fieldValue: string) => {
    const current = getFormLabelTexts(value, activeLabelLocale);
    patch({
      labelTextsByLocale: {
        ...value.labelTextsByLocale,
        [activeLabelLocale]: {
          ...current,
          [field]: fieldValue,
        },
      },
    });
  };

  const defaultCopyPlaceholder = (field: SdkLabelTextField) =>
    t('sdkConfig.fields.defaultPlaceholder', {
      value: getBundledLabelDefault(field, activeLabelLocale),
    });

  return (
    <SdkConfigSection
      id="languages"
      title={t('sdkConfig.sections.languagesLabels.title')}
      description={t('sdkConfig.sections.languagesLabels.description')}
    >
      <SdkSupportedLanguagesFields
        defaultLocale={value.defaultLocale}
        supportedLocales={value.supportedLocales}
        disabled={disabled}
        onChange={({ defaultLocale, supportedLocales }) =>
          patch({
            defaultLocale,
            supportedLocales,
            labelTextsByLocale: syncLabelTextsByLocale(
              value.labelTextsByLocale,
              supportedLocales,
            ),
          })
        }
      />

      <Tip title={t('projectDocs.contextualTips.sdkLanguages.title')}>
        <p>
          {t('projectDocs.contextualTips.sdkLanguages.body')}{' '}
          <DocsLearnMoreLink sectionId="sdk-languages" />
        </p>
      </Tip>

      <div className="space-y-4 border-t border-border pt-4">
        <div>
          <h3 className="text-sm font-medium text-text-primary">
            {t('sdkConfig.fields.labelsGroup')}
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            {t('sdkConfig.fields.languagesLabelsHint')}
          </p>
        </div>

        <SdkLabelLocaleTabs
          locales={value.supportedLocales}
          activeLocale={activeLabelLocale}
          disabled={disabled}
          onChange={setActiveLabelLocale}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <Button
            type="button"
            variant="outline"
            icon={<Sparkles className="h-4 w-4 shrink-0" />}
            loading={translateCopy.isPending}
            disabled={disabled || targetLocales.length === 0}
            onClick={() => void handleTranslate()}
            className="h-auto min-h-10 w-full whitespace-normal px-4 py-2.5 text-sm leading-snug sm:h-10 sm:w-auto sm:whitespace-nowrap sm:px-5 sm:py-0 sm:text-base"
          >
            <span className="sm:hidden">{translateButtonLabelShort}</span>
            <span className="hidden sm:inline">{translateButtonLabel}</span>
          </Button>
          <p className="text-xs leading-relaxed text-text-secondary sm:max-w-md">
            {t('sdkConfig.translate.hint')}
          </p>
        </div>

        <InputField
          label={t('sdkConfig.fields.headerTitle')}
          value={activeLabels.headerTitle}
          onChange={(e) => patchLabelField('headerTitle', e.target.value)}
          placeholder={defaultCopyPlaceholder('headerTitle')}
          disabled={disabled}
        />
        <InputField
          label={t('sdkConfig.fields.headerSubtitle')}
          value={activeLabels.headerSubtitle}
          onChange={(e) => patchLabelField('headerSubtitle', e.target.value)}
          placeholder={defaultCopyPlaceholder('headerSubtitle')}
          disabled={disabled}
        />
        <ToggleSwitch
          checked={value.showHeaderIcon}
          onChange={(showHeaderIcon) => patch({ showHeaderIcon })}
          disabled={disabled}
          label={t('sdkConfig.fields.showHeaderIcon')}
          description={t(
            value.showHeaderIcon
              ? 'sdkConfig.fields.showHeaderIconOnHint'
              : 'sdkConfig.fields.showHeaderIconOffHint',
          )}
        />
        {value.showHeaderIcon ? (
          <InputField
            label={t('sdkConfig.fields.headerIconUrl')}
            value={value.headerIconUrl}
            onChange={(e) => patch({ headerIconUrl: e.target.value })}
            placeholder={t('sdkConfig.fields.headerIconUrlDefault')}
            disabled={disabled}
          />
        ) : null}
        <InputField
          label={t('sdkConfig.fields.emptyTitle')}
          value={activeLabels.emptyTitle}
          onChange={(e) => patchLabelField('emptyTitle', e.target.value)}
          placeholder={defaultCopyPlaceholder('emptyTitle')}
          disabled={disabled}
        />
        <TextArea
          label={t('sdkConfig.fields.emptyDescription')}
          value={activeLabels.emptyDescription}
          onChange={(e) => patchLabelField('emptyDescription', e.target.value)}
          placeholder={defaultCopyPlaceholder('emptyDescription')}
          rows={3}
          disabled={disabled}
        />
        <TextArea
          label={t('sdkConfig.fields.actionsHint')}
          value={activeLabels.actionsHint}
          onChange={(e) => patchLabelField('actionsHint', e.target.value)}
          placeholder={defaultCopyPlaceholder('actionsHint')}
          rows={2}
          disabled={disabled}
        />
        <InputField
          label={t('sdkConfig.fields.placeholder')}
          value={activeLabels.placeholder}
          onChange={(e) => patchLabelField('placeholder', e.target.value)}
          placeholder={defaultCopyPlaceholder('placeholder')}
          disabled={disabled}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label={t('sdkConfig.fields.send')}
            value={activeLabels.send}
            onChange={(e) => patchLabelField('send', e.target.value)}
            placeholder={defaultCopyPlaceholder('send')}
            disabled={disabled}
          />
          <InputField
            label={t('sdkConfig.fields.stop')}
            value={activeLabels.stop}
            onChange={(e) => patchLabelField('stop', e.target.value)}
            placeholder={defaultCopyPlaceholder('stop')}
            disabled={disabled}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label={t('sdkConfig.fields.newConversation')}
            value={activeLabels.newConversation}
            onChange={(e) => patchLabelField('newConversation', e.target.value)}
            placeholder={defaultCopyPlaceholder('newConversation')}
            disabled={disabled}
          />
          <InputField
            label={t('sdkConfig.fields.minimize')}
            value={activeLabels.minimize}
            onChange={(e) => patchLabelField('minimize', e.target.value)}
            placeholder={defaultCopyPlaceholder('minimize')}
            disabled={disabled}
          />
        </div>
      </div>
    </SdkConfigSection>
  );
}
