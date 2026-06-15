export type DemoVideoEmbed =
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'vimeo'; embedUrl: string }
  | { kind: 'direct'; src: string };

const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|ogg)(\?|#|$)/i;

function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

function vimeoEmbedUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}`;
}

function parseYoutubeId(url: URL): string | null {
  if (url.hostname === 'youtu.be') {
    const id = url.pathname.replace(/^\//, '').split('/')[0];
    return id || null;
  }

  if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtube-nocookie.com')) {
    return null;
  }

  if (url.pathname.startsWith('/embed/')) {
    return url.pathname.split('/')[2] ?? null;
  }

  if (url.pathname.startsWith('/shorts/')) {
    return url.pathname.split('/')[2] ?? null;
  }

  return url.searchParams.get('v');
}

function parseVimeoId(url: URL): string | null {
  if (url.hostname === 'player.vimeo.com' && url.pathname.startsWith('/video/')) {
    return url.pathname.split('/')[2] ?? null;
  }

  if (url.hostname === 'vimeo.com' || url.hostname === 'www.vimeo.com') {
    const segments = url.pathname.split('/').filter(Boolean);
    return segments[0] ?? null;
  }

  return null;
}

export function getDemoVideoUrl(): string | undefined {
  const url = import.meta.env.VITE_DEMO_VIDEO_URL?.trim();
  return url || undefined;
}

export function resolveDemoVideoEmbed(rawUrl: string): DemoVideoEmbed | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  if (DIRECT_VIDEO_PATTERN.test(trimmed)) {
    return { kind: 'direct', src: trimmed };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const youtubeId = parseYoutubeId(url);
  if (youtubeId) {
    return { kind: 'youtube', embedUrl: youtubeEmbedUrl(youtubeId) };
  }

  const vimeoId = parseVimeoId(url);
  if (vimeoId) {
    return { kind: 'vimeo', embedUrl: vimeoEmbedUrl(vimeoId) };
  }

  if (DIRECT_VIDEO_PATTERN.test(url.pathname)) {
    return { kind: 'direct', src: trimmed };
  }

  return null;
}
