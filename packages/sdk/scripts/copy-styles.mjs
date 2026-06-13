import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcStyles = join(root, 'src', 'styles');
const outDir = join(root, 'dist', 'styles');

mkdirSync(outDir, { recursive: true });

const tokens = readFileSync(join(srcStyles, 'tokens.css'), 'utf8');
const components = readFileSync(join(srcStyles, 'components.css'), 'utf8');
const devBundle = readFileSync(join(srcStyles, 'styles.css'), 'utf8');
const bundle = devBundle.includes('@import')
  ? `${tokens}\n\n${components}`
  : devBundle;

writeFileSync(join(outDir, 'styles.css'), bundle);
copyFileSync(join(srcStyles, 'tokens.css'), join(outDir, 'tokens.css'));
copyFileSync(join(srcStyles, 'components.css'), join(outDir, 'components.css'));
