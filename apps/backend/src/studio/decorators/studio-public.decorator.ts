import { SetMetadata } from '@nestjs/common';

export const STUDIO_PUBLIC_KEY = 'studioPublic';

/** Skip Studio JWT on this handler (signup, login). */
export const StudioPublic = () => SetMetadata(STUDIO_PUBLIC_KEY, true);
