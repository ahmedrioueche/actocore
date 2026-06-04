import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const playgroundRoot = join(__dirname, '../..');

export function loadPlaygroundEnv() {
  loadEnvFile(join(playgroundRoot, '.env'));
}

export function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export function getBaseUrl() {
  return (
    process.env.ACTOCORE_API_URL ??
    process.env.VITE_ACTOCORE_API_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export function getApiKey() {
  return (
    process.env.VITE_ACTOCORE_API_KEY?.trim() ||
    process.env.ACTOCORE_API_KEY?.trim() ||
    ''
  );
}

/** Merge keys into apps/sdk-playground/.env (creates from .env.example if missing). */
export function writePlaygroundEnv(updates) {
  const envPath = join(playgroundRoot, '.env');
  const examplePath = join(playgroundRoot, '.env.example');

  let lines = [];
  if (existsSync(envPath)) {
    lines = readFileSync(envPath, 'utf8').split('\n');
  } else if (existsSync(examplePath)) {
    lines = readFileSync(examplePath, 'utf8').split('\n');
  }

  const keys = new Set(Object.keys(updates));
  const kept = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return true;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) return true;
    return !keys.has(trimmed.slice(0, eq).trim());
  });

  while (kept.length > 0 && kept[kept.length - 1] === '') {
    kept.pop();
  }

  const appended = Object.entries(updates).map(([k, v]) => `${k}=${v}`);
  writeFileSync(envPath, [...kept, '', ...appended, ''].join('\n'));
  console.log(`Wrote ${envPath}`);
}
