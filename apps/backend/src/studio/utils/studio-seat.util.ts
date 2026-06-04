import { BadRequestException } from '@nestjs/common';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';

/** Workspace seat username: lowercase letters, digits, underscore, hyphen; 2–32 chars. */
const SEAT_USERNAME_RE = /^[a-z0-9][a-z0-9_-]{0,30}[a-z0-9]$|^[a-z0-9]{2}$/;

export function normalizeStudioSeatUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function assertValidStudioSeatUsername(raw: string): string {
  const username = normalizeStudioSeatUsername(raw);
  if (!SEAT_USERNAME_RE.test(username)) {
    throw new BadRequestException({
      errorCode: ErrorCode.VALIDATION_ERROR,
      message:
        'Username must be 2–32 characters: lowercase letters, numbers, underscore, or hyphen.',
    });
  }
  return username;
}

export function isSeatUser(user: { email?: string | null }): boolean {
  return !user.email;
}
