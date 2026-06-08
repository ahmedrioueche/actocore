import { useMemo, useRef, useState } from 'react';
import { ActoChatWidget, ActocoreProvider } from '@ahmedrioueche/actocore-sdk';
import '@ahmedrioueche/actocore-sdk/styles.css';
import { ActocoreIcon } from './ActocoreIcon';
import { DemoUsersPanel } from './DemoUsersPanel';
import { INITIAL_DEMO_USERS } from './demo-users';
import {
  createPlaygroundActions,
  PLAYGROUND_ACTION_NAMES,
} from './playground-actions';

type ThemeMode = 'light' | 'dark' | 'system';

const API_URL = import.meta.env.VITE_ACTOCORE_API_URL ?? 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_ACTOCORE_API_KEY ?? '';

const DEFAULT_ALLOWLIST = PLAYGROUND_ACTION_NAMES.join(',');

function parseAllowlist(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function App() {
  const [locale, setLocale] = useState<'en' | 'fr'>('en');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [allowlistInput, setAllowlistInput] = useState(DEFAULT_ALLOWLIST);
  const [showSources, setShowSources] = useState(true);
  const [showIntentBadge, setShowIntentBadge] = useState(true);
  const [voiceInput, setVoiceInput] = useState(true);
  const [voiceOutput, setVoiceOutput] = useState(true);
  const [loadRemoteConfig, setLoadRemoteConfig] = useState(false);
  const [users, setUsers] = useState(INITIAL_DEMO_USERS);
  const usersRef = useRef(users);
  usersRef.current = users;

  const allowlist = useMemo(
    () => parseAllowlist(allowlistInput),
    [allowlistInput],
  );

  const actions = useMemo(
    () =>
      createPlaygroundActions(
        () => usersRef.current,
        setUsers,
      ),
    [],
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0b1020',
        color: '#ffffff',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 0 }}>
        <ActocoreIcon size={40} />
        <h1 style={{ margin: 0 }}>ActoCore SDK Playground</h1>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '12px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          marginBottom: '20px',
        }}
      >
        <label>
          Locale
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as 'en' | 'fr')}
            style={{ display: 'block', width: '100%' }}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </label>

        <label>
          Theme mode
          <select
            value={themeMode}
            onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
            style={{ display: 'block', width: '100%' }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </label>

        <label>
          Allowed actions (comma separated)
          <input
            value={allowlistInput}
            onChange={(e) => setAllowlistInput(e.target.value)}
            style={{ display: 'block', width: '100%' }}
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={showSources}
            onChange={(e) => setShowSources(e.target.checked)}
          />
          {' '}Show sources
        </label>

        <label>
          <input
            type="checkbox"
            checked={showIntentBadge}
            onChange={(e) => setShowIntentBadge(e.target.checked)}
          />
          {' '}Show intent badge
        </label>

        <label>
          <input
            type="checkbox"
            checked={voiceInput}
            onChange={(e) => setVoiceInput(e.target.checked)}
          />
          {' '}Voice input (mic)
        </label>

        <label>
          <input
            type="checkbox"
            checked={voiceOutput}
            onChange={(e) => setVoiceOutput(e.target.checked)}
          />
          {' '}Voice output (read aloud)
        </label>

        <label>
          <input
            type="checkbox"
            checked={loadRemoteConfig}
            onChange={(e) => setLoadRemoteConfig(e.target.checked)}
          />
          {' '}Load SDK config from backend (PATCH sdk-config first)
        </label>
      </div>

      {!API_KEY ? (
        <div style={{ marginBottom: '16px', color: '#fbbf24' }}>
          Missing <code>VITE_ACTOCORE_API_KEY</code>. With backend running, run{' '}
          <code>npm run setup</code> (see <code>MANUAL_E2E.md</code>) or add a key in{' '}
          <code>.env</code>.
        </div>
      ) : null}

      <DemoUsersPanel users={users} />

      <ActocoreProvider
        apiKey={API_KEY}
        baseURL={API_URL}
        loadRemoteConfig={loadRemoteConfig}
        i18n={{ locale }}
        theme={{ mode: themeMode }}
        security={{
          allowedActionNames: allowlist,
          enforceActionAllowlist: true,
        }}
        voice={{
          input: voiceInput,
          output: voiceOutput,
          inputMode: 'auto',
          language: locale,
        }}
        ui={{
          showSources,
          showIntentBadge,
        }}
        actions={actions}
      >
        <ActoChatWidget />
      </ActocoreProvider>
    </div>
  );
}
