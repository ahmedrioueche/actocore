/** Ensures MongoDB filters are always scoped to a single project. */
export function withProjectId<T extends Record<string, unknown>>(
  projectId: string,
  filter: T = {} as T,
): T & { projectId: string } {
  return { ...filter, projectId };
}
