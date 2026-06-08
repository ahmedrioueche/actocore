import type { PaginationMeta, StudioPlan } from '@ahmedrioueche/actocore-shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import NoData from '@/components/ui/NoData';
import { PaginatedTable } from '@/components/ui/PaginatedTable';
import type { TableColumn } from '@/components/ui/Table';
import { useDeletePlatformPlan } from '@/hooks/use-platform-plans';
import { useModalStore } from '@/stores/modal';

interface PlansTableProps {
  plans: StudioPlan[];
  isLoading: boolean;
  meta?: Pick<PaginationMeta, 'page' | 'pageCount' | 'total' | 'limit'>;
  onPageChange: (page: number) => void;
}

export function PlansTable({
  plans,
  isLoading,
  meta,
  onPageChange,
}: PlansTableProps) {
  const { t, i18n } = useTranslation();
  const openModal = useModalStore((state) => state.openModal);
  const openConfirm = useModalStore((state) => state.openConfirm);
  const deletePlan = useDeletePlatformPlan();

  const columns = useMemo<TableColumn<StudioPlan>[]>(
    () => [
      {
        key: 'planId',
        header: t('admin.plans.planId'),
        render: (plan) => (
          <span className="font-medium text-text-primary">{plan.planId}</span>
        ),
        renderSkeleton: () => (
          <div className="h-4 w-24 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'name',
        header: t('admin.plans.name'),
        render: (plan) => plan.name,
        renderSkeleton: () => (
          <div className="h-4 w-32 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'level',
        header: t('admin.plans.level'),
        width: 'w-28',
        render: (plan) => plan.level,
        renderSkeleton: () => (
          <div className="h-4 w-16 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'monthlyPrice',
        header: t('admin.plans.monthlyPrice'),
        width: 'w-32',
        align: 'right',
        render: (plan) => {
          const monthly = plan.pricing.USD?.monthly ?? 0;
          return new Intl.NumberFormat(i18n.language, {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: monthly % 1 === 0 ? 0 : 2,
          }).format(monthly);
        },
        renderSkeleton: () => (
          <div className="ms-auto h-4 w-16 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'yearlyPrice',
        header: t('admin.plans.yearlyPrice'),
        width: 'w-32',
        align: 'right',
        render: (plan) => {
          const yearly = plan.pricing.USD?.yearly;
          if (yearly == null) {
            return '—';
          }
          return new Intl.NumberFormat(i18n.language, {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: yearly % 1 === 0 ? 0 : 2,
          }).format(yearly);
        },
        renderSkeleton: () => (
          <div className="ms-auto h-4 w-16 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'active',
        header: t('admin.plans.active'),
        width: 'w-24',
        render: (plan) => (plan.isActive ? t('admin.yes') : t('admin.no')),
        renderSkeleton: () => (
          <div className="h-4 w-12 animate-pulse rounded bg-surface-hover" />
        ),
      },
      {
        key: 'actions',
        header: '',
        width: 'w-28',
        align: 'right',
        render: (plan) => (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => openModal('editPlan', { plan })}
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={t('admin.plans.editTitle')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                openConfirm({
                  title: t('admin.plans.delete.title'),
                  text: t('admin.plans.delete.text', {
                    name: plan.name,
                    planId: plan.planId,
                  }),
                  confirmText: t('admin.plans.delete.confirm'),
                  confirmVariant: 'danger',
                  onConfirm: () => {
                    void deletePlan.mutateAsync(plan.id);
                  },
                })
              }
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger"
              aria-label={t('admin.plans.delete.confirm')}
              disabled={deletePlan.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
        renderSkeleton: () => (
          <div className="ms-auto h-8 w-16 animate-pulse rounded-lg bg-surface-hover" />
        ),
      },
    ],
    [deletePlan, i18n.language, openConfirm, openModal, t],
  );

  return (
    <PaginatedTable
      columns={columns}
      data={plans}
      keyExtractor={(plan) => plan.id}
      isLoading={isLoading}
      meta={meta}
      onPageChange={onPageChange}
      emptyState={
        <NoData
          title={t('admin.plans.emptyTitle')}
          description={t('admin.plans.emptyDescription')}
          centered={false}
        />
      }
      renderMobileCard={(plan) => (
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-medium text-text-primary">{plan.name}</p>
            <p className="mt-1 text-xs text-text-secondary">{plan.planId}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => openModal('editPlan', { plan })}
              className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              aria-label={t('admin.plans.editTitle')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                openConfirm({
                  title: t('admin.plans.delete.title'),
                  text: t('admin.plans.delete.text', {
                    name: plan.name,
                    planId: plan.planId,
                  }),
                  confirmText: t('admin.plans.delete.confirm'),
                  confirmVariant: 'danger',
                  onConfirm: () => {
                    void deletePlan.mutateAsync(plan.id);
                  },
                })
              }
              className="rounded-lg p-2 text-text-secondary hover:bg-danger-surface hover:text-danger"
              aria-label={t('admin.plans.delete.confirm')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    />
  );
}
