import { copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const studioRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const syncScript = join(studioRoot, '../../packages/shared/scripts/sync-brand-assets.mjs');

await import(syncScript);
