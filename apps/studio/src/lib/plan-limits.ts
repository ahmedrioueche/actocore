/** True when a finite plan cap exists and usage has reached it. */
export function isAtPlanLimit(
  used: number | undefined,
  limit: number | null | undefined,
): boolean {
  return limit != null && limit > 0 && (used ?? 0) >= limit;
}
