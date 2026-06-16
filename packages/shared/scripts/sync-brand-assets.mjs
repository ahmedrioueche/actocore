import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sharedRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(sharedRoot, 'assets');

const ICON_FILES = [
  'actocore_icon.svg',
  'actocore_icon_inverse.svg',
  'actocore_icon_dark.svg',
  'actocore_favicon.svg',
  'actocore_logo.svg',
];

const targets = [
  join(sharedRoot, '../../apps/web/public'),
  join(sharedRoot, '../../apps/studio/public'),
];

for (const targetDir of targets) {
  mkdirSync(targetDir, { recursive: true });

  for (const file of ICON_FILES) {
    copyFileSync(join(assetsDir, file), join(targetDir, file));
  }
}

console.log(`Synced ${ICON_FILES.length} brand assets to web and studio public/`);
