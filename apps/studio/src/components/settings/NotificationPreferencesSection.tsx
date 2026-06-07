import ToggleSwitch from '@/components/ui/ToggleSwitch';

interface NotificationPreferencesSectionProps {
  failureAlertEmails: boolean;
  quotaWarningEmails: boolean;
  quotaExhaustedEmails: boolean;
  onFailureAlertEmailsChange: (value: boolean) => void;
  onQuotaWarningEmailsChange: (value: boolean) => void;
  onQuotaExhaustedEmailsChange: (value: boolean) => void;
  labels: {
    title: string;
    subtitle: string;
    failure: string;
    failureDescription: string;
    quotaWarning: string;
    quotaWarningDescription: string;
    quotaExhausted: string;
    quotaExhaustedDescription: string;
  };
}

export function NotificationPreferencesSection({
  failureAlertEmails,
  quotaWarningEmails,
  quotaExhaustedEmails,
  onFailureAlertEmailsChange,
  onQuotaWarningEmailsChange,
  onQuotaExhaustedEmailsChange,
  labels,
}: NotificationPreferencesSectionProps) {
  return (
    <section className="space-y-5 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">{labels.title}</h2>
        <p className="mt-1 text-sm text-text-secondary">{labels.subtitle}</p>
      </div>

      <div className="space-y-5">
        <ToggleSwitch
          checked={failureAlertEmails}
          onChange={onFailureAlertEmailsChange}
          label={labels.failure}
          description={labels.failureDescription}
        />
        <ToggleSwitch
          checked={quotaWarningEmails}
          onChange={onQuotaWarningEmailsChange}
          label={labels.quotaWarning}
          description={labels.quotaWarningDescription}
        />
        <ToggleSwitch
          checked={quotaExhaustedEmails}
          onChange={onQuotaExhaustedEmailsChange}
          label={labels.quotaExhausted}
          description={labels.quotaExhaustedDescription}
        />
      </div>
    </section>
  );
}
