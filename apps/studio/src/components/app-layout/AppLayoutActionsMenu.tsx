import { Download, Menu, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Dropdown, { DropdownItem } from '@/components/ui/Dropdown';

interface AppLayoutActionsMenuProps {
  canWrite: boolean;
  onExport: () => void;
  onImport: () => void;
}

export function AppLayoutActionsMenu({
  canWrite,
  onExport,
  onImport,
}: AppLayoutActionsMenuProps) {
  const { t } = useTranslation();

  return (
    <Dropdown
      align="right"
      mobileAsModal
      trigger={
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          aria-label={t('projectLayout.menu.open')}
        >
          <Menu className="h-4 w-4" />
        </button>
      }
    >
      {(close) => (
        <>
          <DropdownItem
            icon={<Download className="h-4 w-4" />}
            label={t('projectLayout.export.button')}
            onClick={() => {
              close();
              onExport();
            }}
          />
          {canWrite ? (
            <DropdownItem
              icon={<UploadCloud className="h-4 w-4" />}
              label={t('projectLayout.import.button')}
              onClick={() => {
                close();
                onImport();
              }}
            />
          ) : null}
        </>
      )}
    </Dropdown>
  );
}
