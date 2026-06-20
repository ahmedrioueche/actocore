import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Map as MapIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AppPageGraphNode,
  type AppPageGraphNodeData,
} from '@/components/app-layout/graph/AppPageGraphNode';
import { AppLayoutGraphToolbar } from '@/components/app-layout/graph/AppLayoutGraphToolbar';
import { AsyncContent, EmptyState } from '@/components/states';
import { useAuth } from '@/context/AuthContext';
import { useProjectActions } from '@/hooks/use-actions';
import {
  useAppPageLinks,
  useCreateAppPageLink,
  useDeleteAppPageLink,
} from '@/hooks/use-app-page-links';
import {
  useAppPages,
  useUpdateAppPageGraphLayout,
} from '@/hooks/use-app-pages';
import { canWriteActions } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';
import { buildGraphPositions } from '@/utils/app-layout-graph-layout';

const nodeTypes = { appPage: AppPageGraphNode };

interface AppLayoutGraphViewProps {
  projectId: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

function AppLayoutGraphInner({
  projectId,
  isFullscreen,
  onToggleFullscreen,
}: AppLayoutGraphViewProps) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const openModal = useModalStore((state) => state.openModal);
  const canWrite = canWriteActions(session);

  const pagesQuery = useAppPages(projectId);
  const linksQuery = useAppPageLinks(projectId);
  const actionsQuery = useProjectActions(projectId, { page: 1, limit: 200 });
  const createLink = useCreateAppPageLink(projectId);
  const deleteLink = useDeleteAppPageLink(projectId);
  const updateGraphLayout = useUpdateAppPageGraphLayout(projectId);

  const saveTimerRef = useRef<number | null>(null);
  const pendingPositionsRef = useRef<Record<string, { x: number; y: number }>>(
    {},
  );

  const pages = pagesQuery.data ?? [];
  const links = linksQuery.data ?? [];
  const actions = actionsQuery.data?.items ?? [];

  const actionsByPage = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const action of actions) {
      for (const pageId of action.pageIds ?? []) {
        const current = map.get(pageId) ?? [];
        current.push(action.name);
        map.set(pageId, current);
      }
    }
    return map;
  }, [actions]);

  const initialNodes = useMemo<Node<AppPageGraphNodeData>[]>(() => {
    const positions = buildGraphPositions(pages);
    return pages.map((page) => ({
      id: page.id,
      type: 'appPage',
      position: positions[page.id] ?? { x: 0, y: 0 },
      data: {
        page,
        actionNames: actionsByPage.get(page.id) ?? [],
        projectId,
        canWrite,
      },
    }));
  }, [actionsByPage, canWrite, pages, projectId]);

  const initialEdges = useMemo<Edge[]>(
    () =>
      links.map((link) => ({
        id: link.id,
        source: link.sourcePageId,
        target: link.targetPageId,
        label: link.label,
        animated: false,
      })),
    [links],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const scheduleLayoutSave = useCallback(
    (pageId: string, x: number, y: number) => {
      pendingPositionsRef.current[pageId] = { x, y };
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        const positions = { ...pendingPositionsRef.current };
        pendingPositionsRef.current = {};
        void updateGraphLayout.mutateAsync({ positions });
      }, 500);
    },
    [updateGraphLayout],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node<AppPageGraphNodeData>>[]) => {
      onNodesChange(changes);
      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          scheduleLayoutSave(change.id, change.position.x, change.position.y);
        }
      }
    },
    [onNodesChange, scheduleLayoutSave],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!canWrite || !connection.source || !connection.target) {
        return;
      }
      void createLink.mutateAsync({
        sourcePageId: connection.source,
        targetPageId: connection.target,
      });
    },
    [canWrite, createLink],
  );

  const handleEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      if (!canWrite) {
        return;
      }
      for (const edge of deleted) {
        void deleteLink.mutateAsync(edge.id);
      }
    },
    [canWrite, deleteLink],
  );

  const handleEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (!canWrite) {
        return;
      }
      openModal('editAppPageLink', { projectId, linkId: edge.id });
    },
    [canWrite, openModal, projectId],
  );

  const handleAddPage = useCallback(() => {
    openModal('createAppPage', { projectId });
  }, [openModal, projectId]);

  useEffect(
    () => () => {
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current);
      }
    },
    [],
  );

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 flex flex-col bg-background'
          : 'flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-background'
      }
    >
      <AppLayoutGraphToolbar
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onAddPage={handleAddPage}
        canWrite={canWrite}
      />

      <AsyncContent
        isLoading={pagesQuery.isLoading || linksQuery.isLoading}
        isError={pagesQuery.isError || linksQuery.isError}
        onRetry={() => {
          void pagesQuery.refetch();
          void linksQuery.refetch();
        }}
        loadingClassName="min-h-[28rem]"
      >
        <div className="min-h-0 flex-1">
          {pages.length === 0 ? (
            <EmptyState
              icon={MapIcon}
              title={t('projectPages.sections.layout.emptyTitle')}
              description={t('projectPages.sections.layout.emptyDescription')}
              actionButton={
                canWrite
                  ? {
                      label: t('projectLayout.create.button'),
                      onClick: handleAddPage,
                    }
                  : undefined
              }
            />
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={handleConnect}
              onEdgesDelete={handleEdgesDelete}
              onEdgeDoubleClick={handleEdgeDoubleClick}
              fitView
              minZoom={0.2}
              maxZoom={2}
              panOnDrag
              panOnScroll
              zoomOnScroll
              zoomOnPinch
              deleteKeyCode={canWrite ? ['Backspace', 'Delete'] : null}
              proOptions={{ hideAttribution: true }}
              className="h-full min-h-[28rem] bg-background"
            >
              <Background gap={20} size={1} />
            </ReactFlow>
          )}
        </div>
      </AsyncContent>
    </div>
  );
}

export function AppLayoutGraphView(props: AppLayoutGraphViewProps) {
  return (
    <ReactFlowProvider>
      <AppLayoutGraphInner {...props} />
    </ReactFlowProvider>
  );
}
