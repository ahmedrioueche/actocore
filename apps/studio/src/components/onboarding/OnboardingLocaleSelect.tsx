import { UiLanguageSelect } from '@/components/settings/UiLanguageSelect';
import type { StudioLanguage } from '@/constants/languages';

interface OnboardingLocaleSelectProps {
  value: StudioLanguage;
  onChange: (value: StudioLanguage) => void;
}

export function OnboardingLocaleSelect({
  value,
  onChange,
}: OnboardingLocaleSelectProps) {
  return (
    <UiLanguageSelect
      value={value}
      onChange={onChange}
      labelKey="onboarding.workspace.locale"
      hintKey="onboarding.workspace.localeHint"
    />
  );
}
