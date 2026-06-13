/** Host-app page definition authored in Studio App Layout. */
export interface AppPageData {
  id: string;
  projectId: string;
  /** Stable id for hostContext.currentPage (e.g. "members"). */
  slug: string;
  title: string;
  /** Host route pattern, e.g. "/members" or "/members/:id". */
  route: string;
  /** LLM-facing summary of what the page is for. */
  description?: string;
  enabled: boolean;
  order: number;
  /** Actions linked to this page (populated by list/detail endpoints). */
  actionCount?: number;
  createdAt: string;
  updatedAt: string;
}

/** Slim page entry exposed on GET /v1/sdk/runtime. */
export interface AppPageManifestEntry {
  id: string;
  title: string;
  route: string;
  description?: string;
}
