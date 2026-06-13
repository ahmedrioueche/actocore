/** Live host-app state sent with each chat message (not static manifest). */
export interface HostContextSelectedEntity {
  type: string;
  id: string;
  label?: string;
}

export interface HostContext {
  /** Matches AppPageData.slug — stable page id for AI reasoning. */
  currentPage?: string;
  /** Actual browser path, e.g. "/members/42". */
  route?: string;
  selectedEntity?: HostContextSelectedEntity | null;
  openModal?: string | null;
  /** Host-app role (not Studio RBAC). */
  userRole?: string;
  custom?: Record<string, unknown>;
}
