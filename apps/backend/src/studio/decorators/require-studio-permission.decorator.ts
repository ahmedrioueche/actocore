import { SetMetadata } from '@nestjs/common';

export const STUDIO_PERMISSION_KEY = 'studioPermission';

export const RequireStudioPermission = (...permissions: string[]) =>
  SetMetadata(STUDIO_PERMISSION_KEY, permissions);
