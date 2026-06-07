import {
  StudioRole,
  type StudioMemberData,
} from '@ahmedrioueche/actocore-shared';

export function memberLabel(member: StudioMemberData): string {
  return (
    member.displayName ||
    member.email ||
    member.username ||
    member.userId
  );
}

export function isEditableTeamMember(member: StudioMemberData): boolean {
  return member.role === StudioRole.USER_EDITOR;
}

export function formatMemberProjectsLabel(
  member: StudioMemberData,
  t: (key: string) => string,
): string {
  if (member.projectIds.length === 0) {
    return t('team.allProjects');
  }
  return String(member.projectIds.length);
}
