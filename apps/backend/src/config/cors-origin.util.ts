/** Returns true when `origin` matches an exact allowlist entry or a wildcard pattern. */
export function isCorsOriginAllowed(
  origin: string,
  exactOrigins: readonly string[],
  patterns: readonly string[],
): boolean {
  if (exactOrigins.includes(origin)) {
    return true;
  }

  return patterns.some((pattern) => matchesCorsOriginPattern(origin, pattern));
}

export function matchesCorsOriginPattern(
  origin: string,
  pattern: string,
): boolean {
  if (!pattern.includes('*')) {
    return origin === pattern;
  }

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  if (/^https?:\/\//i.test(pattern)) {
    const match = pattern.match(/^(https?):\/\/(.+)$/i);
    if (!match) {
      return false;
    }

    const [, proto, hostPattern] = match;
    if (url.protocol !== `${proto!.toLowerCase()}:`) {
      return false;
    }

    return matchHostname(url.hostname, hostPattern!);
  }

  return matchHostname(url.hostname, pattern);
}

function matchHostname(hostname: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return hostname === pattern;
  }

  if (pattern.startsWith('*.')) {
    const baseDomain = pattern.slice(2);
    return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
  }

  const regex = new RegExp(
    `^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]+')}$`,
  );
  return regex.test(hostname);
}

export function splitExactOriginsAndPatterns(
  origins: readonly string[],
): { exact: string[]; patterns: string[] } {
  const exact: string[] = [];
  const patterns: string[] = [];

  for (const origin of origins) {
    if (origin.includes('*')) {
      patterns.push(origin);
    } else {
      exact.push(origin);
    }
  }

  return { exact, patterns };
}

/** When Studio runs on actocore.pro, allow sibling subdomains (e.g. staging). */
export function inferActocoreOriginPattern(
  studioAppUrl: string | undefined,
): string | undefined {
  if (!studioAppUrl?.trim()) {
    return undefined;
  }

  try {
    const hostname = new URL(studioAppUrl.trim()).hostname.toLowerCase();
    if (hostname === 'actocore.pro' || hostname.endsWith('.actocore.pro')) {
      return '*.actocore.pro';
    }
  } catch {
    return undefined;
  }

  return undefined;
}
