import { FileText, UploadCloud, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import {
  formatBytes,
  KNOWLEDGE_ACCEPT,
  KNOWLEDGE_ALLOWED_EXTENSIONS,
  KNOWLEDGE_MAX_BYTES,
  validateKnowledgeFile,
} from '@/constants/knowledge';
import { useUploadKnowledge } from '@/hooks/use-knowledge';
import {
  useModalStore,
  type UploadKnowledgeModalProps,
} from '@/stores/modal';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function UploadKnowledgeModal() {
  const { t } = useTranslation();
  const currentModal = useModalStore((state) => state.currentModal);
  const modalProps = useModalStore((state) => state.modalProps);
  const closeModal = useModalStore((state) => state.closeModal);

  const isOpen = currentModal === 'uploadKnowledge';
  const projectId = (modalProps as UploadKnowledgeModalProps | null)?.projectId;

  const uploadKnowledge = useUploadKnowledge(projectId ?? null);

  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setTitle('');
      setError(null);
      setIsDragging(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const selectFile = (candidate: File) => {
    const validationError = validateKnowledgeFile(candidate);
    if (validationError) {
      setFile(null);
      setError(t(`knowledge.upload.errors.${validationError.reason}`));
      return;
    }
    setError(null);
    setFile(candidate);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const candidate = e.target.files?.[0];
    if (candidate) {
      selectFile(candidate);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const candidate = e.dataTransfer.files?.[0];
    if (candidate) {
      selectFile(candidate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError(t('knowledge.upload.errors.required'));
      return;
    }
    setError(null);
    try {
      await uploadKnowledge.mutateAsync({
        file,
        title: title.trim() || undefined,
      });
      closeModal();
    } catch (err) {
      const code = (err as Error & { errorCode?: string }).errorCode;
      setError(
        getApiErrorMessage(t, {
          errorCode: code,
          message: err instanceof Error ? err.message : undefined,
        }),
      );
    }
  };

  const acceptHint = KNOWLEDGE_ALLOWED_EXTENSIONS.join(', ');
  const sizeHint = formatBytes(KNOWLEDGE_MAX_BYTES);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('knowledge.upload.title')}
      subtitle={t('knowledge.upload.subtitle')}
      icon={UploadCloud}
      maxWidth="max-w-lg"
      primaryButton={{
        label: t('knowledge.upload.submit'),
        type: 'submit',
        form: 'upload-knowledge-form',
        loading: uploadKnowledge.isPending,
        disabled: !file,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: closeModal,
        variant: 'ghost',
      }}
      showSecondaryButton
    >
      <form
        id="upload-knowledge-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-secondary p-3">
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
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={t('common.remove')}
            >
              <X className="h-4 w-4" />
            </button>
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
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={KNOWLEDGE_ACCEPT}
          onChange={handleInputChange}
          className="hidden"
        />

        <InputField
          label={t('knowledge.upload.titleLabel')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('knowledge.upload.titlePlaceholder')}
        />

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </BaseModal>
  );
}
