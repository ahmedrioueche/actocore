import { AccountLocaleSelect } from '@/components/settings/AccountLocaleSelect';

interface OnboardingLocaleSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function OnboardingLocaleSelect({
  value,
  onChange,
}: OnboardingLocaleSelectProps) {
  return (
    <AccountLocaleSelect
      value={value}
      onChange={onChange}
      labelKey="onboarding.workspace.locale"
      hintKey="onboarding.workspace.localeHint"
      placeholderKey="onboarding.workspace.localePlaceholder"
      allowEmpty
    />
  );
}
