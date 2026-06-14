# Changelog

All notable changes to `@ahmedrioueche/actocore-sdk` are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Also sync each release to `packages/shared/src/constants/sdk-releases.ts` (Studio reads that file).

## [0.1.0] - 2026-06-15

**Compatible `@ahmedrioueche/actocore-shared`:** 0.0.31

### Added

- Launch release for production embeds (Studio + Core staging/production)

### Changed

- Documented as the recommended install target for new integrations

## [0.0.2] - 2026-06-01

**Compatible `@ahmedrioueche/actocore-shared`:** 0.0.31

### Added

- Dashboard-driven SDK config via `loadRemoteConfig` on `ActocoreProvider`
- Session message history pagination in `useActocoreSession`

### Changed

- Streaming assistant content rendering improvements

## [0.0.1] - 2026-05-01

**Compatible `@ahmedrioueche/actocore-shared`:** 0.0.31

### Added

- Initial public release: `ActocoreProvider`, `ActoChatWidget`, and `ActoChat`
- Action handler registration, i18n, and theme token support
- Voice input and server transcription hooks
