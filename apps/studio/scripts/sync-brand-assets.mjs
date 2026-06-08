import { copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const studioRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sharedAssets = join(studioRoot, '../../packages/shared/assets');
const publicDir = join(studioRoot, 'public');

copyFileSync(
  join(sharedAssets, 'actocore_icon.svg'),
  join(publicDir, 'actocore_icon.svg'),
);
