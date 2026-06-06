import { Check, Code2, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import { useProjectActions } from '@/hooks/use-actions';
import { useModalStore, type ActionsSdkCodeModalProps } from '@/stores/modal';
import { buildSdkIntegrationCode } from '@/utils/action-schema-builder';

const ACTIONS_FETCH_LIMIT = 100;

export default function ActionsSdkCodeModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'actionsSdkCode';
  const props = modalProps as ActionsSdkCodeModalProps | null;
  const projectId = props?.projectId ?? null;

  const actionsQuery = useProjectActions(projectId, {
    page: 1,
    limit: ACTIONS_FETCH_LIMIT,
  });

  const [copied, setCopied] = useState(false);

  const enabledCount =
    actionsQuery.data?.items.filter((action) => action.enabled).length ?? 0;

  const snippet = useMemo(() => {
    if (!actionsQuery.data) {
      return '';
    }

    return buildSdkIntegrationCode(actionsQuery.data.items);
  }, [actionsQuery.data]);

  const isTruncated =
    Boolean(actionsQuery.data) &&
    actionsQuery.data!.total > actionsQuery.data!.items.length;

  const handleCopy = async () => {
    if (!snippet) {
      return;
    }

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

  const isLoading = actionsQuery.isLoading;
  const isEmpty = !isLoading && enabledCount === 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('projectActions.generateCode.title')}
      subtitle={t('projectActions.generateCode.subtitle')}
      icon={Code2}
      maxWidth="max-w-2xl"
      primaryButton={
        isEmpty || isLoading
          ? undefined
          : {
              label: copied
                ? t('projectActions.generateCode.copied')
                : t('projectActions.generateCode.copySnippet'),
              icon: Copy,
              onClick: () => void handleCopy(),
            }
      }
      secondaryButton={{
        label: t('projectActions.generateCode.done'),
        onClick: handleClose,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-text-secondary">
            {t('projectActions.generateCode.loading')}
          </p>
        ) : isEmpty ? (
          <p className="rounded-xl border border-dashed border-border bg-surface-secondary px-4 py-6 text-center text-sm text-text-secondary">
            {t('projectActions.generateCode.empty')}
          </p>
        ) : (
          <>
            <p className="text-sm text-text-secondary">
              {t('projectActions.generateCode.hint')}
            </p>
            {isTruncated ? (
              <p className="text-xs text-warning">
                {t('projectActions.generateCode.truncatedHint', {
                  count: actionsQuery.data!.items.length,
                  total: actionsQuery.data!.total,
                })}
              </p>
            ) : null}
            <div className="flex items-stretch gap-2">
              <pre className="block max-h-[min(24rem,50vh)] min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-surface-secondary px-4 py-3 font-mono text-xs text-text-primary whitespace-pre-wrap">
                {snippet}
              </pre>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="flex shrink-0 items-center justify-center rounded-xl border border-border px-3 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                title={
                  copied
                    ? t('projectActions.generateCode.copied')
                    : t('projectActions.generateCode.copySnippet')
                }
                aria-label={
                  copied
                    ? t('projectActions.generateCode.copied')
                    : t('projectActions.generateCode.copySnippet')
                }
              >
                {copied ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}
