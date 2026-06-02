/** Join optional class names for customizable UI slots. */
export function mergeClassNames(
  ...parts: Array<string | undefined | false>
): string | undefined {
  const merged = parts.filter(Boolean).join(' ');
  return merged || undefined;
}
