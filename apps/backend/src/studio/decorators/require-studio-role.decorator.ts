import { SetMetadata } from '@nestjs/common';
import type { StudioRole } from '@ahmedrioueche/actocore-shared';

export const STUDIO_ROLE_KEY = 'studioRole';

export const RequireStudioRole = (...roles: StudioRole[]) =>
  SetMetadata(STUDIO_ROLE_KEY, roles);
