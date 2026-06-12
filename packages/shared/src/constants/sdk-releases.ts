/** Curated SDK release notes — synced on each npm publish (see packages/sdk/RELEASE_CHECKLIST.md). */

export interface SdkReleaseEntry {
  version: string;
  releasedAt: string;
  /** Compatible @ahmedrioueche/actocore-shared semver. */
  sharedVersion: string;
  summary: string;
  changes: string[];
  breaking?: string[];
}

/** Newest release first. */
export const SDK_RELEASES: SdkReleaseEntry[] = [
  {
    version: '0.0.2',
    releasedAt: '2026-06-01',
    sharedVersion: '0.0.31',
    summary: 'Remote SDK config, session history, and streaming improvements.',
    changes: [
      'Load dashboard-driven theme, copy, locale, and security via loadRemoteConfig',
      'Session message history pagination in useActocoreSession',
      'Streaming assistant content rendering updates',
    ],
  },
  {
    version: '0.0.1',
    releasedAt: '2026-05-01',
    sharedVersion: '0.0.31',
    summary: 'Initial public release of the embeddable React SDK.',
    changes: [
      'ActocoreProvider and ActoChatWidget entry points',
      'Action handlers, i18n, and theme token support',
      'Voice input and server transcription hooks',
    ],
  },
];

export const SDK_LATEST_VERSION = SDK_RELEASES[0]?.version ?? '0.0.2';
