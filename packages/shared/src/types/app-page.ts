/** Canvas position for App layout graph view. */
export interface AppPageGraphPosition {
  x: number;
  y: number;
}

/** Screen = real route; container = structural grouping node on the layout map. */
export type AppPageKind = 'screen' | 'container';

/** Goal-oriented capability on a page (guidance, not execution). */
export interface AppPageFunctionality {
  /** Stable slug-like id within the page (e.g. "delete_project"). */
  id: string;
  title: string;
  /** LLM-facing description of how to accomplish this on the page. */
  description?: string;
  /** Optional link to an existing in-app action. */
  linkedActionId?: string;
}

/** Directed navigation link between two app layout pages. */
export interface AppPageLinkData {
  id: string;
  projectId: string;
  sourcePageId: string;
  targetPageId: string;
  label?: string;
}

/** Host-app page definition authored in Studio App Layout. */
export interface AppPageData {
  id: string;
  projectId: string;
  /** Stable id for hostContext.currentPage (e.g. "members"). */
  slug: string;
  title: string;
  /** Host route pattern, e.g. "/members" or "/members/:id". */
  route: string;
  /** screen (default) or container grouping node. */
  pageKind?: AppPageKind;
  /** LLM-facing summary of what the page is for. */
  description?: string;
  enabled: boolean;
  order: number;
  /** Graph canvas position in Studio App layout. */
  graphPosition?: AppPageGraphPosition;
  /** Parent page Mongo id; omit or null for top-level pages. */
  parentPageId?: string | null;
  /** Goal-oriented capabilities shown on the page node. */
  functionalities?: AppPageFunctionality[];
  /** Actions linked to this page (populated by list/detail endpoints). */
  actionCount?: number;
  createdAt: string;
  updatedAt: string;
}

/** Slim functionality entry for SDK manifest. */
export interface AppPageFunctionalityManifestEntry {
  id: string;
  title: string;
  description?: string;
  linkedActionName?: string;
}

/** Slim page entry exposed on GET /v1/sdk/runtime. */
export interface AppPageManifestEntry {
  /** Stable page slug for hostContext.currentPage. */
  id: string;
  /** Mongo id for linking actions to this page in Studio. */
  pageId?: string;
  title: string;
  route: string;
  pageKind?: AppPageKind;
  description?: string;
  /** Parent page Mongo id for hierarchy. */
  parentPageId?: string;
  /** Parent page slug for LLM context. */
  parentPageSlug?: string;
  functionalities?: AppPageFunctionalityManifestEntry[];
}

/** Slim link entry for SDK manifest. */
export interface AppPageLinkManifestEntry {
  sourcePageId: string;
  targetPageId: string;
  label?: string;
}

export interface SdkManifestActionEntry {
  name: string;
  description?: string;
  pageIds?: string[];
}
