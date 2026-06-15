export type PlaygroundProjectCredentials = {
  projectId: string;
  projectName: string;
  apiKey: string;
  playgroundToken: string;
};

const STORAGE_KEY = 'actocore-playground-project';

export function loadPlaygroundProject(): PlaygroundProjectCredentials | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PlaygroundProjectCredentials;
    if (
      parsed?.projectId &&
      parsed?.apiKey &&
      parsed?.playgroundToken &&
      parsed?.projectName
    ) {
      return parsed;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return null;
}

export function savePlaygroundProject(credentials: PlaygroundProjectCredentials): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
}

export function clearPlaygroundProject(): void {
  localStorage.removeItem(STORAGE_KEY);
}
