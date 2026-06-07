import { describe, expect, it } from 'vitest';

import { StudioRole, type StudioMemberData } from '@ahmedrioueche/actocore-shared';

import {
  formatMemberProjectsLabel,
  isEditableTeamMember,
  memberLabel,
} from './team';

const editor: StudioMemberData = {
  userId: 'u1',
  username: 'jane',
  displayName: 'Jane Doe',
  role: StudioRole.USER_EDITOR,
  permissions: [],
  projectIds: ['p1', 'p2'],
  createdAt: new Date().toISOString(),
};

const admin: StudioMemberData = {
  userId: 'u2',
  email: 'owner@example.com',
  role: StudioRole.USER_ADMIN,
  permissions: [],
  projectIds: [],
  createdAt: new Date().toISOString(),
};

describe('team utils', () => {
  it('resolves member labels', () => {
    expect(memberLabel(editor)).toBe('Jane Doe');
    expect(memberLabel(admin)).toBe('owner@example.com');
  });

  it('detects editable members', () => {
    expect(isEditableTeamMember(editor)).toBe(true);
    expect(isEditableTeamMember(admin)).toBe(false);
  });

  it('formats project access labels', () => {
    const t = (key: string) => (key === 'team.allProjects' ? 'All' : key);
    expect(formatMemberProjectsLabel(editor, t)).toBe('2');
    expect(formatMemberProjectsLabel(admin, t)).toBe('All');
  });
});
