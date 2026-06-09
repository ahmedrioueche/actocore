import { describe, expect, it, beforeEach } from 'vitest';
import {
  buildPersistedSessionStorageKey,
  clearPersistedSessionId,
  readPersistedSessionId,
  writePersistedSessionId,
} from './persist-session';

const scopeA = {
  apiKey: 'aco_test_key',
  baseURL: 'http://localhost:3000',
  externalUserId: 'user-1',
};

const scopeB = {
  apiKey: 'aco_other_key',
  baseURL: 'http://localhost:3000',
  externalUserId: 'user-1',
};

describe('persist-session', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('builds different keys for different scopes', () => {
    expect(buildPersistedSessionStorageKey(scopeA)).not.toBe(
      buildPersistedSessionStorageKey(scopeB),
    );
  });

  it('writes, reads, and clears a session id', () => {
    writePersistedSessionId(scopeA, '507f1f77bcf86cd799439011');
    expect(readPersistedSessionId(scopeA)).toBe('507f1f77bcf86cd799439011');
    expect(readPersistedSessionId(scopeB)).toBeNull();

    clearPersistedSessionId(scopeA);
    expect(readPersistedSessionId(scopeA)).toBeNull();
  });

  it('scopes persistence by externalUserId', () => {
    writePersistedSessionId(scopeA, 'session-a');
    writePersistedSessionId(
      { ...scopeA, externalUserId: 'user-2' },
      'session-b',
    );

    expect(readPersistedSessionId(scopeA)).toBe('session-a');
    expect(
      readPersistedSessionId({ ...scopeA, externalUserId: 'user-2' }),
    ).toBe('session-b');
  });
});
