import { Check, Copy, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import { useFeatureModal } from '@/hooks/use-feature-modal';

export default function IssuedApiKeyModal() {
  const { t } = useTranslation();
  const { isOpen, props, closeModal } = useFeatureModal('issuedApiKey');
  const apiKey = props?.apiKey ?? '';

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleClose = () => {
    setCopied(false);
    closeModal();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('apiKeys.issued.title')}
      subtitle={t('apiKeys.issued.subtitle')}
      icon={KeyRound}
      maxWidth="max-w-lg"
      primaryButton={{
        label: copied ? t('apiKeys.issued.copied') : t('apiKeys.issued.copy'),
        icon: Copy,
        onClick: () => void handleCopy(),
      }}
      secondaryButton={{
        label: t('apiKeys.issued.done'),
        onClick: handleClose,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <div className="space-y-3">
        <div className="flex items-stretch gap-2">
          <code className="block min-w-0 flex-1 break-all rounded-xl border border-border bg-surface-secondary px-4 py-3 font-mono text-sm text-text-primary">
            {apiKey}
          </code>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex shrink-0 items-center justify-center rounded-xl border border-border px-3 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            title={copied ? t('apiKeys.issued.copied') : t('apiKeys.issued.copy')}
            aria-label={
              copied ? t('apiKeys.issued.copied') : t('apiKeys.issued.copy')
            }
          >
            {copied ? (
              <Check className="h-5 w-5 text-success" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-sm text-warning">{t('apiKeys.issued.warning')}</p>
      </div>
    </BaseModal>
  );
}
