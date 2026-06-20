import type { AppLayoutExportV1 } from '@ahmedrioueche/actocore-shared';
import {
  parseAppLayoutExportJson,
  validateAppLayoutExport,
} from '@ahmedrioueche/actocore-shared';
import { UploadCloud, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { useImportAppLayout } from '@/hooks/use-app-layout-import';
import { useFeatureModal } from '@/hooks/use-feature-modal';
import { useModalStore } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { cn } from '@/utils/helper';

const ACCEPT = '.json,application/json';

export default function ImportAppLayoutModal() {
  const { t } = useTranslation();
  const { isOpen, props, closeModal } = useFeatureModal('importAppLayout');
  const openConfirm = useModalStore((state) => state.openConfirm);
  const projectId = props?.projectId ?? null;

  const importLayout = useImportAppLayout(projectId);
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [layout, setLayout] = useState<AppLayoutExportV1 | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [includeActionAssignments, setIncludeActionAssignments] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setParseError(null);
      setLayout(null);
      setValidationErrors([]);
      setValidationWarnings([]);
      setMode('merge');
      setIncludeActionAssignments(false);
      setIsDragging(false);
    }
  }, [isOpen]);

  if (!isOpen || !projectId) {
    return null;
  }

  const loadFile = async (candidate: File) => {
    setFile(candidate);
    setParseError(null);
    setLayout(null);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      const text = await candidate.text();
      const parsed = parseAppLayoutExportJson(text);
      const validation = validateAppLayoutExport(parsed);
      setLayout(parsed);
      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : t('projectLayout.import.parseError'),
      );
    }
  };

  const runImport = async () => {
    if (!layout || validationErrors.length > 0) {
      return;
    }

    try {
      const result = await importLayout.mutateAsync({
        mode,
        includeActionAssignments,
        layout,
      });

      if (result.warnings.length > 0) {
        toast.success(
          t('projectLayout.import.successWithWarnings', {
            created: result.created,
            updated: result.updated,
          }),
        );
      } else {
        toast.success(
          t('projectLayout.import.success', {
            created: result.created,
            updated: result.updated,
          }),
        );
      }
      closeModal();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('projectLayout.import.failed'),
      );
    }
  };

  const handleImportClick = () => {
    if (!layout || validationErrors.length > 0) {
      return;
    }

    if (mode === 'replace') {
      openConfirm({
        title: t('projectLayout.import.replaceConfirmTitle'),
        text: t('projectLayout.import.replaceConfirmText'),
        confirmText: t('projectLayout.import.replaceConfirmSubmit'),
        confirmVariant: 'danger',
        onConfirm: () => {
          void runImport();
        },
      });
      return;
    }

    void runImport();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('projectLayout.import.title')}
      subtitle={t('projectLayout.import.subtitle')}
      icon={UploadCloud}
      maxWidth="max-w-lg"
      primaryButton={{
        label: t('projectLayout.import.submit'),
        onClick: handleImportClick,
        loading: importLayout.isPending,
        disabled:
          !layout ||
          validationErrors.length > 0 ||
          importLayout.isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        disabled: importLayout.isPending,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          const candidate = event.target.files?.[0];
          if (candidate) {
            void loadFile(candidate);
          }
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const candidate = event.dataTransfer.files[0];
          if (candidate) {
            void loadFile(candidate);
          }
        }}
        className={cn(
          'mb-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/40 hover:bg-surface-hover',
        )}
      >
        <UploadCloud className="mb-2 h-8 w-8 text-text-secondary" />
        <p className="text-sm font-medium text-text-primary">
          {t('projectLayout.import.dropLabel')}
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          {t('projectLayout.import.dropHint')}
        </p>
      </div>

      {file ? (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-surface-secondary px-3 py-2">
          <span className="truncate text-sm text-text-primary">{file.name}</span>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setLayout(null);
              setParseError(null);
              setValidationErrors([]);
              setValidationWarnings([]);
            }}
            className="rounded-lg p-1 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            aria-label={t('common.remove')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {parseError ? (
        <p className="mb-4 text-sm text-danger">{parseError}</p>
      ) : null}

      {layout ? (
        <div className="mb-4 space-y-2 rounded-lg border border-border bg-surface-secondary p-3 text-sm">
          <p className="text-text-primary">
            {t('projectLayout.import.preview', {
              pages: layout.pages.length,
              links: layout.links.length,
            })}
          </p>
          {validationErrors.map((error) => (
            <p key={error} className="text-danger">
              {error}
            </p>
          ))}
          {validationWarnings.map((warning) => (
            <p key={warning} className="text-text-secondary">
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-text-primary">
            {t('projectLayout.import.modeLabel')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode('merge')}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm transition-colors',
                mode === 'merge'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-text-secondary hover:bg-surface-hover',
              )}
            >
              {t('projectLayout.import.modeMerge')}
            </button>
            <button
              type="button"
              onClick={() => setMode('replace')}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm transition-colors',
                mode === 'replace'
                  ? 'border-danger bg-danger-surface text-danger'
                  : 'border-border text-text-secondary hover:bg-surface-hover',
              )}
            >
              {t('projectLayout.import.modeReplace')}
            </button>
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            {mode === 'merge'
              ? t('projectLayout.import.modeMergeHint')
              : t('projectLayout.import.modeReplaceHint')}
          </p>
        </div>

        <ToggleSwitch
          checked={includeActionAssignments}
          onChange={setIncludeActionAssignments}
          label={t('projectLayout.import.includeActions')}
        />
      </div>
    </BaseModal>
  );
}
