import type {
  ApiKeyIssuedData,
  ApiKeyMetadata,
} from '@ahmedrioueche/actocore-shared';
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from '@tanstack/react-router';

import { CreateApiKeyModal } from '@/components/api-keys/CreateApiKeyModal';
import { EditApiKeyModal } from '@/components/api-keys/EditApiKeyModal';
import { IssuedApiKeyModal } from '@/components/api-keys/IssuedApiKeyModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { AsyncContent, EmptyState } from '@/components/states';
import Button from '@/components/ui/Button';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useAuth } from '@/context/AuthContext';
import {
  useCreateApiKey,
  useProjectApiKeys,
  useRevokeApiKey,
  useUpdateApiKey,
} from '@/hooks/use-api-keys';
import { useProject } from '@/hooks/use-projects';
import { canWriteApiKeys } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';

function formatKeyLabel(key: ApiKeyMetadata): string {
  return key.name?.trim() || key.prefix;
}

export default function ProjectApiKeysPage() {
  const { t, i18n } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const { session } = useAuth();
  const openConfirm = useModalStore((state) => state.openConfirm);

  const projectQuery = useProject(projectId ?? null);
  const keysQuery = useProjectApiKeys(projectId ?? null);
  const createKey = useCreateApiKey(projectId ?? null);
  const updateKey = useUpdateApiKey(projectId ?? null);
  const revokeKey = useRevokeApiKey(projectId ?? null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editKey, setEditKey] = useState<ApiKeyMetadata | null>(null);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);

  const canWrite = canWriteApiKeys(session);
  const keys = keysQuery.data ?? [];
  const projectName = projectQuery.data?.name;

  const formatCreated = (value: string) =>
    new Date(value).toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const formatLastUsed = (value?: string) =>
    value ? formatCreated(value) : t('apiKeys.neverUsed');

  const columns: TableColumn<ApiKeyMetadata>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('apiKeys.columns.name'),
        render: (key) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-text-primary">
              {formatKeyLabel(key)}
            </p>
            <p className="truncate font-mono text-xs text-text-secondary">
              {key.prefix}…
            </p>
          </div>
        ),
        renderSkeleton: () => (
          <div className="h-10 w-40 animate-pulse rounded-lg bg-surface-hover" />
        ),
      },
      {
        key: 'created',
        header: t('apiKeys.columns.created'),
        width: 'w-36',
        render: (key) => (
          <span className="text-sm text-text-secondary">
            {formatCreated(key.createdAt)}
          </span>
        ),
        renderSkeleton: () => (
          <div className="h-4 w-24 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'lastUsed',
        header: t('apiKeys.columns.lastUsed'),
        width: 'w-36',
        render: (key) => (
          <span className="text-sm text-text-secondary">
            {formatLastUsed(key.lastUsedAt)}
          </span>
        ),
        renderSkeleton: () => (
          <div className="h-4 w-24 animate-pulse rounded bg-surface-hover" />
        ),
      },
      ...(canWrite
        ? [
            {
              key: 'actions',
              header: '',
              width: 'w-28',
              align: 'right' as const,
              render: (key: ApiKeyMetadata) => (
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setEditKey(key)}
                    className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                    aria-label={t('apiKeys.edit.title')}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openConfirm({
                        title: t('apiKeys.delete.title'),
                        text: t('apiKeys.delete.text', {
                          name: formatKeyLabel(key),
                        }),
                        confirmText: t('apiKeys.delete.confirm'),
                        confirmVariant: 'danger',
                        onConfirm: () => {
                          void revokeKey.mutateAsync(key.id);
                        },
                      });
                    }}
                    className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger"
                    aria-label={t('apiKeys.delete.confirm')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
              renderSkeleton: () => (
                <div className="ms-auto h-8 w-16 animate-pulse rounded-lg bg-surface-hover" />
              ),
            },
          ]
        : []),
    ],
    [canWrite, i18n.language, openConfirm, revokeKey, t],
  );

  const handleCreate = async (name?: string) => {
    const issued: ApiKeyIssuedData = await createKey.mutateAsync(name);
    setIssuedKey(issued.key);
  };

  const isEmpty =
    !keysQuery.isLoading && !keysQuery.isError && keys.length === 0;

  return (
    <>
      <PageHeader
        title={t('projectPages.sections.apiKeys.title')}
        subtitle={
          projectName
            ? t('projectPages.sectionSubtitle', { project: projectName })
            : t('projectPages.sections.apiKeys.emptyDescription')
        }
        actions={
          canWrite ? (
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              {t('apiKeys.create.button')}
            </Button>
          ) : null
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={KeyRound}
          title={t('projectPages.sections.apiKeys.emptyTitle')}
          description={t('projectPages.sections.apiKeys.emptyDescription')}
        />
      ) : (
        <AsyncContent
          isLoading={keysQuery.isLoading}
          isError={keysQuery.isError}
          onRetry={() => void keysQuery.refetch()}
          loadingVariant="table"
        >
          <Table
            columns={columns}
            data={keys}
            keyExtractor={(key) => key.id}
            isLoading={keysQuery.isLoading}
          />
        </AsyncContent>
      )}

      <CreateApiKeyModal
        isOpen={createOpen}
        loading={createKey.isPending}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

      <EditApiKeyModal
        isOpen={Boolean(editKey)}
        apiKey={editKey}
        loading={updateKey.isPending}
        onClose={() => setEditKey(null)}
        onSave={async (keyId, name) => {
          await updateKey.mutateAsync({ keyId, name });
        }}
      />

      <IssuedApiKeyModal
        isOpen={Boolean(issuedKey)}
        apiKey={issuedKey ?? ''}
        onClose={() => setIssuedKey(null)}
      />
    </>
  );
}
