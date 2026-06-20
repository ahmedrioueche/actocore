import { Check, Copy, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import { useFeatureModal } from '@/hooks/use-feature-modal';
import { useModalStore, type ActionCreatedModalProps  } from '@/stores/modal';
import { buildSdkHandlerSnippet } from '@/utils/action-schema-builder';

export default function ActionCreatedModal() {
  const { t } = useTranslation();
  const { isOpen, props, closeModal } = useFeatureModal('actionCreated');
  const actionName = props?.actionName ?? '';
  const parameters = props?.parameters ?? [];

  const [copied, setCopied] = useState(false);

  const snippet = useMemo(
    () => buildSdkHandlerSnippet(actionName, parameters),
    [actionName, parameters],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
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
      title={t('projectActions.created.title')}
      subtitle={t('projectActions.created.subtitle', { name: actionName })}
      icon={Zap}
      maxWidth="max-w-lg"
      primaryButton={{
        label: copied
          ? t('projectActions.created.copied')
          : t('projectActions.created.copySnippet'),
        icon: Copy,
        onClick: () => void handleCopy(),
      }}
      secondaryButton={{
        label: t('projectActions.created.done'),
        onClick: handleClose,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">
          {t('projectActions.created.handlerHint')}
        </p>
        <div className="flex items-stretch gap-2">
          <pre className="block min-w-0 flex-1 overflow-x-auto rounded-xl border border-border bg-surface-secondary px-4 py-3 font-mono text-xs text-text-primary whitespace-pre-wrap">
            {snippet}
          </pre>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex shrink-0 items-center justify-center rounded-xl border border-border px-3 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            title={
              copied
                ? t('projectActions.created.copied')
                : t('projectActions.created.copySnippet')
            }
            aria-label={
              copied
                ? t('projectActions.created.copied')
                : t('projectActions.created.copySnippet')
            }
          >
            {copied ? (
              <Check className="h-5 w-5 text-success" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
