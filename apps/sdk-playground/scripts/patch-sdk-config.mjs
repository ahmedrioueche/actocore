/**
 * PATCH project sdk-config for loadRemoteConfig E2E tests.
 *
 * Usage (from apps/sdk-playground):
 *   npm run config:fr
 *   npm run config:allowlist
 *   node scripts/patch-sdk-config.mjs --preset reset
 */
import {
  getBaseUrl,
  loadPlaygroundEnv,
} from './lib/playground-env.mjs';
import { requestJson, resolveProjectId } from './lib/playground-api.mjs';

const PRESETS = {
  fr: {
    i18n: { locale: 'fr' },
    ui: { showIntentBadge: true, showSources: true },
    security: {
      allowedActionNames: ['add_user', 'delete_user', 'update_user', 'list_users'],
    },
  },
  allowlist: {
    security: { allowedActionNames: ['list_users'] },
    ui: { showIntentBadge: true },
  },
  reset: {
    i18n: { locale: 'en' },
    ui: { showIntentBadge: false, showSources: true },
    security: {
      allowedActionNames: [
        'add_user',
        'delete_user',
        'update_user',
        'list_users',
      ],
    },
    voice: { input: true, output: true },
  },
};

async function main() {
  loadPlaygroundEnv();
  const presetName = process.argv.find((a) => a.startsWith('--preset='))?.split('=')[1]
    ?? process.argv[process.argv.indexOf('--preset') + 1]
    ?? 'fr';

  const body = PRESETS[presetName];
  if (!body) {
    console.error(`Unknown preset: ${presetName}. Use: ${Object.keys(PRESETS).join(', ')}`);
    process.exit(1);
  }

  const projectId = await resolveProjectId();
  const baseUrl = getBaseUrl();

  console.log(`PATCH ${baseUrl}/v1/web/projects/${projectId}/sdk-config`);
  console.log(`Preset: ${presetName}`);
  console.log(JSON.stringify(body, null, 2));

  const res = await requestJson(
    'PATCH',
    `/v1/web/projects/${projectId}/sdk-config`,
    body,
  );

  console.log('\nOK — sdkConfigVersion:', res.data?.sdkConfigVersion);
  console.log('In playground: enable "Load SDK config from backend" and reload the page.\n');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
