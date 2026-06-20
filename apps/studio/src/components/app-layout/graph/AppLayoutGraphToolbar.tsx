import {
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Scan,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReactFlow } from '@xyflow/react';

import Button from '@/components/ui/Button';
import { AppLayoutActionsMenu } from '@/components/app-layout/AppLayoutActionsMenu';

interface AppLayoutGraphToolbarProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onAddPage: () => void;
  onAddContainer: () => void;
  onExport: () => void;
  onImport: () => void;
  canWrite: boolean;
}

export function AppLayoutGraphToolbar({
  isFullscreen,
  onToggleFullscreen,
  onAddPage,
  onAddContainer,
  onExport,
  onImport,
  canWrite,
}: AppLayoutGraphToolbarProps) {
  const { t } = useTranslation();
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => zoomOut()}
          className="rounded-lg border border-border p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          aria-label={t('projectLayout.graph.zoomOut')}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomIn()}
          className="rounded-lg border border-border p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          aria-label={t('projectLayout.graph.zoomIn')}
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => void fitView({ padding: 0.2, duration: 200 })}
          className="rounded-lg border border-border p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          aria-label={t('projectLayout.graph.fitView')}
        >
          <Scan className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onToggleFullscreen}
        className="rounded-lg border border-border p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        aria-label={
          isFullscreen
            ? t('projectLayout.graph.exitFullscreen')
            : t('projectLayout.graph.enterFullscreen')
        }
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </button>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {canWrite ? (
          <>
            <Button type="button" variant="outline" onClick={onAddContainer}>
              {t('projectLayout.create.containerButton')}
            </Button>
            <Button type="button" onClick={onAddPage}>
              {t('projectLayout.create.button')}
            </Button>
          </>
        ) : null}
        <AppLayoutActionsMenu
          canWrite={canWrite}
          onExport={onExport}
          onImport={onImport}
        />
      </div>
    </div>
  );
}
