import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type {
  AppPageData,
  AppPageLinkData,
  ActionData,
} from '@ahmedrioueche/actocore-shared';
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
  buildOptimisticAppPageLinkId,
  isOptimisticAppPageLinkId,
} from '@/hooks/use-app-page-links';
import {
  useAppPages,
  useUpdateAppPageGraphLayout,
} from '@/hooks/use-app-pages';
import { canWriteActions } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';
import { useAppLayoutGraphCollapseStore } from '@/stores/app-layout-graph-collapse';
import { buildGraphPositions } from '@/utils/app-layout-graph-layout';
import { countDirectChildren } from '@/utils/app-layout-page-tree';

const nodeTypes = { appPage: AppPageGraphNode };

const EMPTY_PAGES: AppPageData[] = [];
const EMPTY_LINKS: AppPageLinkData[] = [];
const EMPTY_ACTIONS: ActionData[] = [];

function isSameGraphNodeData(
  current: AppPageGraphNodeData,
  next: AppPageGraphNodeData,
): boolean {
  if (
    current.projectId !== next.projectId ||
    current.canWrite !== next.canWrite ||
    current.page.id !== next.page.id ||
    current.page.updatedAt !== next.page.updatedAt ||
    (current.page.parentPageId ?? null) !== (next.page.parentPageId ?? null) ||
    (current.page.pageKind ?? 'screen') !== (next.page.pageKind ?? 'screen')
  ) {
    return false;
  }

  if (current.childCount !== next.childCount) {
    return false;
  }

  if (current.actionNames.length !== next.actionNames.length) {
    return false;
  }

  return current.actionNames.every(
    (name, index) => name === next.actionNames[index],
  );
}

function mergeGraphNodes(
  current: Node<AppPageGraphNodeData>[],
  incoming: Node<AppPageGraphNodeData>[],
): Node<AppPageGraphNodeData>[] {
  if (incoming.length === 0) {
    return incoming;
  }

  const currentById = new Map(current.map((node) => [node.id, node]));
  let changed = current.length !== incoming.length;

  const merged = incoming.map((node) => {
    const existing = currentById.get(node.id);
    if (!existing) {
      changed = true;
      return node;
    }

    const position = existing.position;
    const dataUnchanged = isSameGraphNodeData(existing.data, node.data);
    const positionUnchanged =
      position.x === existing.position.x &&
      position.y === existing.position.y;

    if (dataUnchanged && positionUnchanged) {
      return existing;
    }

    changed = true;
    return {
      ...node,
      position,
    };
  });

  return changed ? merged : current;
}

function isContainsGraphEdge(edge: Edge): boolean {
  return edge.type === 'contains' || edge.id.startsWith('contains-');
}

function navigationEdgeKey(edge: Pick<Edge, 'source' | 'target'>): string {
  return `${edge.source}\0${edge.target}`;
}

function mergeGraphEdges(current: Edge[], incoming: Edge[]): Edge[] {
  if (incoming.length === 0) {
    return incoming;
  }

  const incomingNavKeys = new Set(
    incoming
      .filter((edge) => !isContainsGraphEdge(edge))
      .map((edge) => navigationEdgeKey(edge)),
  );
  const currentById = new Map(current.map((edge) => [edge.id, edge]));
  const currentNavByKey = new Map(
    current
      .filter((edge) => !isContainsGraphEdge(edge))
      .map((edge) => [navigationEdgeKey(edge), edge] as const),
  );

  let changed = current.length !== incoming.length;

  const mergedIncoming = incoming.map((edge) => {
    const existingById = currentById.get(edge.id);
    if (
      existingById &&
      existingById.source === edge.source &&
      existingById.target === edge.target &&
      existingById.label === edge.label
    ) {
      return existingById;
    }

    if (!isContainsGraphEdge(edge)) {
      const existingByKey = currentNavByKey.get(navigationEdgeKey(edge));
      if (
        existingByKey &&
        existingByKey.source === edge.source &&
        existingByKey.target === edge.target &&
        (existingByKey.label ?? undefined) === (edge.label ?? undefined)
      ) {
        if (existingByKey.id !== edge.id) {
          changed = true;
          return { ...existingByKey, id: edge.id, label: edge.label };
        }
        return existingByKey;
      }
    }

    changed = true;
    return edge;
  });

  const pendingNavigation = current.filter(
    (edge) =>
      !isContainsGraphEdge(edge) &&
      !incomingNavKeys.has(navigationEdgeKey(edge)),
  );

  if (pendingNavigation.length > 0) {
    changed = true;
  }

  if (!changed) {
    return current;
  }

  return [...mergedIncoming, ...pendingNavigation];
}

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
  const ensureCollapseLoaded = useAppLayoutGraphCollapseStore(
    (state) => state.ensureProjectLoaded,
  );
  const getHiddenPageIds = useAppLayoutGraphCollapseStore(
    (state) => state.getHiddenPageIds,
  );
  const collapsedByProject = useAppLayoutGraphCollapseStore(
    (state) => state.collapsedByProject[projectId],
  );

  useEffect(() => {
    ensureCollapseLoaded(projectId);
  }, [ensureCollapseLoaded, projectId]);

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
  const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );
  const persistedLayoutRef = useRef<Set<string>>(new Set());

  const pages = pagesQuery.data ?? EMPTY_PAGES;
  const links = linksQuery.data ?? EMPTY_LINKS;
  const actions = actionsQuery.data?.items ?? EMPTY_ACTIONS;

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

  const hiddenPageIds = useMemo(
    () => getHiddenPageIds(projectId, pages),
    [collapsedByProject, getHiddenPageIds, pages, projectId],
  );

  const visiblePages = useMemo(
    () => pages.filter((page) => !hiddenPageIds.has(page.id)),
    [hiddenPageIds, pages],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AppPageGraphNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    nodePositionsRef.current = new Map(
      nodes.map((node) => [
        node.id,
        { x: node.position.x, y: node.position.y },
      ]),
    );
  }, [nodes]);

  const initialNodes = useMemo<Node<AppPageGraphNodeData>[]>(() => {
    const anchors = new Map<string, { x: number; y: number }>();
    for (const page of pages) {
      if (page.graphPosition) {
        anchors.set(page.id, page.graphPosition);
      }
    }
    for (const [id, position] of nodePositionsRef.current) {
      anchors.set(id, position);
    }

    const positions = buildGraphPositions(pages, anchors);
    return visiblePages.map((page) => ({
      id: page.id,
      type: 'appPage',
      position: positions[page.id] ?? { x: 0, y: 0 },
      data: {
        page,
        actionNames: actionsByPage.get(page.id) ?? [],
        projectId,
        canWrite,
        childCount: countDirectChildren(page.id, pages),
      },
    }));
  }, [actionsByPage, canWrite, pages, projectId, visiblePages]);

  const initialEdges = useMemo<Edge[]>(() => {
    const containsEdges: Edge[] = visiblePages
      .filter((page) => page.parentPageId && !hiddenPageIds.has(page.parentPageId))
      .map((page) => ({
        id: `contains-${page.parentPageId}-${page.id}`,
        source: page.parentPageId!,
        target: page.id,
        type: 'contains',
        selectable: false,
        deletable: false,
        focusable: false,
        animated: false,
      }));

    const navigationEdges: Edge[] = links
      .filter(
        (link) =>
          !hiddenPageIds.has(link.sourcePageId) &&
          !hiddenPageIds.has(link.targetPageId),
      )
      .map((link) => ({
        id: link.id,
        source: link.sourcePageId,
        target: link.targetPageId,
        label: link.label,
        type: 'navigation',
        animated: false,
      }));

    return [...containsEdges, ...navigationEdges];
  }, [hiddenPageIds, links, visiblePages]);

  useEffect(() => {
    setNodes((current) => mergeGraphNodes(current, initialNodes));
  }, [initialNodes, setNodes]);

  useEffect(() => {
    if (!canWrite) {
      return;
    }

    const pending: Record<string, { x: number; y: number }> = {};
    for (const node of initialNodes) {
      const page = pages.find((entry) => entry.id === node.id);
      if (
        !page ||
        page.graphPosition ||
        persistedLayoutRef.current.has(page.id)
      ) {
        continue;
      }
      pending[page.id] = node.position;
      persistedLayoutRef.current.add(page.id);
    }

    if (Object.keys(pending).length === 0) {
      return;
    }

    void updateGraphLayout.mutateAsync({ positions: pending });
  }, [canWrite, initialNodes, pages, updateGraphLayout]);

  useEffect(() => {
    setEdges((current) => mergeGraphEdges(current, initialEdges));
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
      if (connection.source === connection.target) {
        return;
      }

      const alreadyLinked =
        links.some(
          (link) =>
            link.sourcePageId === connection.source &&
            link.targetPageId === connection.target,
        ) ||
        edges.some(
          (edge) =>
            !isContainsGraphEdge(edge) &&
            edge.source === connection.source &&
            edge.target === connection.target,
        );

      if (alreadyLinked) {
        return;
      }

      const optimisticId = buildOptimisticAppPageLinkId(
        connection.source,
        connection.target,
      );

      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: optimisticId,
            type: 'navigation',
          },
          current,
        ),
      );

      void createLink.mutateAsync({
        sourcePageId: connection.source,
        targetPageId: connection.target,
      });
    },
    [canWrite, createLink, edges, links, setEdges],
  );

  const handleEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      if (!canWrite) {
        return;
      }
      for (const edge of deleted) {
        if (edge.type === 'contains' || edge.id.startsWith('contains-')) {
          continue;
        }
        if (isOptimisticAppPageLinkId(edge.id)) {
          continue;
        }
        void deleteLink.mutateAsync(edge.id);
      }
    },
    [canWrite, deleteLink],
  );

  const handleEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (!canWrite || edge.type === 'contains' || edge.id.startsWith('contains-')) {
        return;
      }
      openModal('editAppPageLink', { projectId, linkId: edge.id });
    },
    [canWrite, openModal, projectId],
  );

  const handleAddPage = useCallback(() => {
    openModal('createAppPage', { projectId, pageKind: 'screen' });
  }, [openModal, projectId]);

  const handleAddContainer = useCallback(() => {
    openModal('createAppPage', { projectId, pageKind: 'container' });
  }, [openModal, projectId]);

  const handleExport = useCallback(() => {
    openModal('exportAppLayout', { projectId });
  }, [openModal, projectId]);

  const handleImport = useCallback(() => {
    openModal('importAppLayout', { projectId });
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
        onAddContainer={handleAddContainer}
        onExport={handleExport}
        onImport={handleImport}
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
              defaultEdgeOptions={{
                type: 'navigation',
              }}
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
              className="h-full min-h-[28rem] bg-background [&_.react-flow__edge.contains path]:stroke-text-secondary [&_.react-flow__edge.contains path]:stroke-dasharray-[6_4] [&_.react-flow__edge.contains path]:stroke-[1.5]"
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
