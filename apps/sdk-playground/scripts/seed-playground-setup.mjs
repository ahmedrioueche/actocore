/**
 * One-shot playground bootstrap: project + API key (if needed), actions, knowledge.
 * Run from apps/sdk-playground with backend up: npm run setup
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function runScript(name) {
  const script = join(__dirname, name);
  console.log(`\n> node ${name}\n`);
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('=== ActoCore SDK Playground setup ===');
console.log(`Working directory: ${root}\n`);

runScript('seed-playground-actions.mjs');
runScript('seed-playground-knowledge.mjs');

console.log('\n=== Setup complete ===');
console.log('Next: npm run dev');
console.log('Manual E2E checklist: MANUAL_E2E.md\n');
