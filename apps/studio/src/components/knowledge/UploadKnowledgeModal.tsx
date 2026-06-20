import { FileText, UploadCloud, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import {
  formatBytes,
  KNOWLEDGE_ACCEPT,
  KNOWLEDGE_ALLOWED_EXTENSIONS,
  KNOWLEDGE_BULK_UPLOAD_MAX_FILES,
  KNOWLEDGE_MAX_BYTES,
  validateKnowledgeFile,
} from '@/constants/knowledge';
import { useUploadKnowledgeBatch } from '@/hooks/use-knowledge';
import { useFeatureModal } from '@/hooks/use-feature-modal';
import { toast } from '@/stores/toast';
import { cn } from '@/utils/helper';

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function UploadKnowledgeModal() {
  const { t } = useTranslation();
  const { isOpen, props, closeModal } = useFeatureModal('uploadKnowledge');
  const projectId = props?.projectId;

  const uploadBatch = useUploadKnowledgeBatch(projectId ?? null);

  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFiles([]);
      setTitle('');
      setFileErrors({});
      setIsDragging(false);
      setUploadProgress(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const addFiles = (candidates: FileList | File[]) => {
    const incoming = Array.from(candidates);
    if (incoming.length === 0) {
      return;
    }

    const nextErrors: Record<string, string> = { ...fileErrors };
    const accepted: File[] = [];
    const existingKeys = new Set(files.map(fileKey));

    for (const candidate of incoming) {
      const key = fileKey(candidate);
      if (existingKeys.has(key)) {
        continue;
      }

      const validationError = validateKnowledgeFile(candidate);
      if (validationError) {
        nextErrors[key] = t(
          `knowledge.upload.errors.${validationError.reason}`,
        );
        continue;
      }

      accepted.push(candidate);
      existingKeys.add(key);
      delete nextErrors[key];
    }

    const combined = [...files, ...accepted];
    if (combined.length > KNOWLEDGE_BULK_UPLOAD_MAX_FILES) {
      toast.error(
        t('knowledge.upload.errors.tooMany', {
          max: KNOWLEDGE_BULK_UPLOAD_MAX_FILES,
        }),
      );
      setFiles(combined.slice(0, KNOWLEDGE_BULK_UPLOAD_MAX_FILES));
      setFileErrors(nextErrors);
      return;
    }

    setFileErrors(nextErrors);
    setFiles(combined);
  };

  const removeFile = (target: File) => {
    const key = fileKey(target);
    setFiles((prev) => prev.filter((file) => fileKey(file) !== key));
    setFileErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error(t('knowledge.upload.errors.required'));
      return;
    }

    setUploadProgress({ current: 0, total: files.length });

    try {
      const result = await uploadBatch.mutateAsync({
        files,
        title: files.length === 1 ? title.trim() || undefined : undefined,
        onProgress: (current, total) => {
          setUploadProgress({ current, total });
        },
      });

      if (result.uploaded.length > 0) {
        toast.success(
          result.uploaded.length === 1
            ? t('knowledge.upload.successOne')
            : t('knowledge.upload.successMany', {
                count: result.uploaded.length,
              }),
        );
      }

      if (result.failures.length > 0) {
        const failureMap: Record<string, string> = {};
        for (const failure of result.failures) {
          failureMap[fileKey(failure.file)] = failure.message;
        }
        setFileErrors(failureMap);
        setFiles(result.failures.map((failure) => failure.file));
        toast.error(
          t('knowledge.upload.errors.partial', { count: result.failures.length }),
        );
        return;
      }

      closeModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setUploadProgress(null);
    }
  };

  const acceptHint = KNOWLEDGE_ALLOWED_EXTENSIONS.join(', ');
  const sizeHint = formatBytes(KNOWLEDGE_MAX_BYTES);
  const isUploading = uploadBatch.isPending || uploadProgress !== null;
  const showTitleField = files.length === 1;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('knowledge.upload.title')}
      subtitle={t('knowledge.upload.subtitle')}
      icon={UploadCloud}
      maxWidth="max-w-lg"
      primaryButton={{
        label:
          uploadProgress !== null
            ? t('knowledge.upload.progress', {
                current: uploadProgress.current,
                total: uploadProgress.total,
              })
            : files.length > 1
              ? t('knowledge.upload.submitMany', { count: files.length })
              : t('knowledge.upload.submit'),
        type: 'submit',
        form: 'upload-knowledge-form',
        loading: isUploading,
        disabled: files.length === 0,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
        disabled: isUploading,
      }}
      showSecondaryButton
    >
      <form
        id="upload-knowledge-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        {files.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-text-primary">
                {t('knowledge.upload.selected', { count: files.length })}
              </p>
              {!isUploading ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t('knowledge.upload.addMore')}
                </button>
              ) : null}
            </div>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {files.map((file) => {
                const key = fileKey(file);
                const itemError = fileErrors[key];
                return (
                  <li
                    key={key}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3',
                      itemError
                        ? 'border-danger/30 bg-danger-surface/40'
                        : 'border-border bg-surface-secondary',
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {file.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatBytes(file.size)}
                      </p>
                      {itemError ? (
                        <p className="mt-1 text-xs text-danger">{itemError}</p>
                      ) : null}
                    </div>
                    {!isUploading ? (
                      <button
                        type="button"
                        onClick={() => removeFile(file)}
                        className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                        aria-label={t('common.remove')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-surface-hover'
            }`}
          >
            <UploadCloud className="h-8 w-8 text-text-secondary" />
            <p className="text-sm font-medium text-text-primary">
              {t('knowledge.upload.dropzone')}
            </p>
            <p className="text-xs text-text-secondary">
              {t('knowledge.upload.hint', { types: acceptHint, size: sizeHint })}
            </p>
            <p className="text-xs text-text-secondary">
              {t('knowledge.upload.bulkHint', {
                max: KNOWLEDGE_BULK_UPLOAD_MAX_FILES,
              })}
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={KNOWLEDGE_ACCEPT}
          onChange={handleInputChange}
          className="hidden"
        />

        {showTitleField ? (
          <InputField
            label={t('knowledge.upload.titleLabel')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('knowledge.upload.titlePlaceholder')}
            disabled={isUploading}
          />
        ) : files.length > 1 ? (
          <p className="text-xs text-text-secondary">
            {t('knowledge.upload.titleBulkHint')}
          </p>
        ) : null}

      </form>
    </BaseModal>
  );
}
