import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translate } from '@vitalets/google-translate-api';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../src/i18n/locales');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));

const PRESERVE = new Set([
  'ActoCore Studio',
  'ActoCore',
  'ActoCore Admin',
  'PayPal',
  'Google',
  'SDK',
  'API',
  'JSON',
  'HTML',
  'React',
  'USD',
  'LLM',
  'MRR',
  'P95',
  'Q&A',
  'const',
  'app',
  'studio',
  'mode',
  'action',
  'intelligence',
  'true',
  'features',
  'engine',
  'neural-v4',
  'context',
  'app_state',
  'QA',
  'Automation',
  'loadRemoteConfig',
  'ActocoreProvider',
  'VITE_ACTOCORE_API_KEY',
  'VITE_ACTOCORE_API_URL',
  'Free',
  'Starter',
  'Pro',
  'Business',
  'Master',
  'Manager',
  'OpenAI',
  'Anthropic',
  'Stub',
  'Inter',
  'Roboto',
  'DM Sans',
  'Georgia',
  'Visa',
  'DZ',
  'US',
  'EG',
]);

function flatten(obj, prefix = '') {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flatten(value, pathKey));
    } else if (typeof value === 'string') {
      out[pathKey] = value;
    }
  }
  return out;
}

function unflatten(flat) {
  const root = {};
  for (const [pathKey, value] of Object.entries(flat)) {
    const parts = pathKey.split('.');
    let cursor = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      cursor[parts[i]] = cursor[parts[i]] ?? {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
  }
  return root;
}

function protectPlaceholders(text) {
  const tokens = [];
  const protectedText = text.replace(/\{\{[^}]+\}\}/g, (match) => {
    const token = `__PH_${tokens.length}__`;
    tokens.push(match);
    return token;
  });
  return { protectedText, tokens };
}

function restorePlaceholders(text, tokens) {
  let result = text;
  tokens.forEach((token, index) => {
    result = result.replace(`__PH_${index}__`, token);
    result = result.replace(`__ PH _ ${index} __`, token);
    result = result.replace(new RegExp(`__\\s*PH\\s*_\\s*${index}\\s*__`, 'g'), token);
  });
  return result;
}

function shouldSkipTranslation(text) {
  if (!text.trim()) return true;
  if (PRESERVE.has(text)) return true;
  if (/^[\d\s.,:;#@$%&*()[\]{}<>/\\|~`'"+=_-]+$/.test(text)) return true;
  if (text.startsWith('http')) return true;
  if (text.includes('ActocoreProvider') || text.includes('loadRemoteConfig')) return true;
  return false;
}

async function translateText(text) {
  if (shouldSkipTranslation(text)) {
    return text;
  }

  const { protectedText, tokens } = protectPlaceholders(text);
  const { text: translated } = await translate(protectedText, { from: 'en', to: 'fr' });
  return restorePlaceholders(translated, tokens);
}

async function main() {
  const flat = flatten(en);
  const entries = Object.entries(flat);
  const translated = {};
  const batchSize = 20;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async ([key, value]) => {
        try {
          const frValue = await translateText(value);
          return [key, frValue];
        } catch (error) {
          console.warn(`Failed ${key}:`, error.message);
          return [key, value];
        }
      }),
    );
    for (const [key, value] of results) {
      translated[key] = value;
    }
    console.log(`Translated ${Math.min(i + batchSize, entries.length)} / ${entries.length}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const fr = unflatten(translated);
  fs.writeFileSync(
    path.join(localesDir, 'fr.json'),
    `${JSON.stringify(fr, null, 2)}\n`,
    'utf8',
  );
  console.log('Wrote fr.json');
}

await main();
