import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  findChatLocalePreset,
  isValidSdkChatLocaleCode,
  normalizeSdkChatLocaleCode,
  normalizeSupportedChatLocales,
  SDK_CHAT_LOCALE_PRESETS,
  SDK_CONFIG_MAX_SUPPORTED_CHAT_LOCALES,
} from '@/constants/sdk-chat-locales';
import CustomSelect from '@/components/ui/CustomSelect';
import InputField from '@/components/ui/InputField';
import { cn } from '@/utils/helper';

type AddLocaleError = 'invalid' | 'duplicate' | 'max';

interface SdkSupportedLanguagesFieldsProps {
  defaultLocale: string;
  supportedLocales: string[];
  onChange: (value: {
    defaultLocale: string;
    supportedLocales: string[];
  }) => void;
  disabled?: boolean;
}

export function SdkSupportedLanguagesFields({
  defaultLocale,
  supportedLocales,
  onChange,
  disabled = false,
}: SdkSupportedLanguagesFieldsProps) {
  const { t } = useTranslation();
  const [draftLocale, setDraftLocale] = useState('');
  const [addError, setAddError] = useState<AddLocaleError | null>(null);

  const resolveLocaleLabel = (code: string) => {
    const preset = findChatLocalePreset(code);
    return preset ? t(preset.labelKey) : code.toUpperCase();
  };

  const addLocale = (raw: string) => {
    const normalized = normalizeSdkChatLocaleCode(raw);
    if (!normalized || !isValidSdkChatLocaleCode(normalized)) {
      setAddError('invalid');
      return;
    }
    if (supportedLocales.includes(normalized)) {
      setAddError('duplicate');
      return;
    }
    if (supportedLocales.length >= SDK_CONFIG_MAX_SUPPORTED_CHAT_LOCALES) {
      setAddError('max');
      return;
    }

    setAddError(null);
    setDraftLocale('');
    onChange({
      defaultLocale,
      supportedLocales: normalizeSupportedChatLocales(
        [...supportedLocales, normalized],
        defaultLocale,
      ),
    });
  };

  const removeLocale = (code: string) => {
    if (supportedLocales.length <= 1) {
      return;
    }

    const nextSupported = supportedLocales.filter((locale) => locale !== code);
    const nextDefault = defaultLocale === code ? nextSupported[0]! : defaultLocale;
    onChange({
      defaultLocale: nextDefault,
      supportedLocales: normalizeSupportedChatLocales(
        nextSupported,
        nextDefault,
      ),
    });
  };

  const quickAddPresets = SDK_CHAT_LOCALE_PRESETS.filter(
    (preset) => !supportedLocales.includes(preset.code),
  );

  const defaultOptions = supportedLocales.map((code) => ({
    value: code,
    label: resolveLocaleLabel(code),
    name: code,
  }));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-text-primary">
          {t('sdkConfig.fields.supportedLocales')}
        </p>

        <div
          className="flex flex-wrap gap-2"
          role="list"
          aria-label={t('sdkConfig.fields.supportedLocales')}
        >
          {supportedLocales.map((code) => (
            <span
              key={code}
              role="listitem"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-secondary px-2.5 py-1.5 text-sm text-text-primary"
            >
              {resolveLocaleLabel(code)}
              <button
                type="button"
                disabled={disabled || supportedLocales.length <= 1}
                onClick={() => removeLocale(code)}
                className={cn(
                  'rounded-md p-0.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary',
                  (disabled || supportedLocales.length <= 1) &&
                    'cursor-not-allowed opacity-40',
                )}
                aria-label={t('sdkConfig.fields.removeLocale', {
                  locale: resolveLocaleLabel(code),
                })}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <InputField
              label={t('sdkConfig.fields.addLocale')}
              value={draftLocale}
              onChange={(event) => {
                setDraftLocale(event.target.value);
                setAddError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addLocale(draftLocale);
                }
              }}
              placeholder={t('sdkConfig.fields.addLocalePlaceholder')}
              disabled={disabled}
            />
          </div>
          <button
            type="button"
            disabled={
              disabled ||
              !draftLocale.trim() ||
              supportedLocales.length >= SDK_CONFIG_MAX_SUPPORTED_CHAT_LOCALES
            }
            onClick={() => addLocale(draftLocale)}
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover',
              'disabled:cursor-not-allowed disabled:opacity-50 sm:mb-0',
            )}
          >
            <Plus className="h-4 w-4" />
            {t('sdkConfig.fields.addLocaleAction')}
          </button>
        </div>

        {addError ? (
          <p className="text-sm text-danger">
            {t(`sdkConfig.fields.addLocaleErrors.${addError}`, {
              max: SDK_CONFIG_MAX_SUPPORTED_CHAT_LOCALES,
            })}
          </p>
        ) : null}

        {quickAddPresets.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-text-secondary">
              {t('sdkConfig.fields.localeQuickAdd')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickAddPresets.map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  disabled={
                    disabled ||
                    supportedLocales.length >= SDK_CONFIG_MAX_SUPPORTED_CHAT_LOCALES
                  }
                  onClick={() => addLocale(preset.code)}
                  className={cn(
                    'rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary/40 hover:text-text-primary',
                    disabled && 'cursor-not-allowed opacity-50',
                  )}
                >
                  + {t(preset.labelKey)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p className="text-xs leading-relaxed text-text-secondary">
          {t('sdkConfig.fields.supportedLocalesHint', {
            max: SDK_CONFIG_MAX_SUPPORTED_CHAT_LOCALES,
          })}
        </p>
      </div>

      <CustomSelect
        title={t('sdkConfig.fields.defaultLocale')}
        options={defaultOptions}
        selectedOption={defaultLocale}
        disabled={disabled || defaultOptions.length <= 1}
        searchable={defaultOptions.length > 5}
        onChange={(nextDefault) => {
          onChange({
            defaultLocale: nextDefault,
            supportedLocales: normalizeSupportedChatLocales(
              supportedLocales,
              nextDefault,
            ),
          });
        }}
      />

      <p className="text-xs leading-relaxed text-text-secondary">
        {t('sdkConfig.fields.activeLocaleHostHint')}
      </p>
    </div>
  );
}
