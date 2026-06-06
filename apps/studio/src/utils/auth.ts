import { signOut } from '@/lib/auth-session';
import { ensureApiConfigured } from '@/lib/configure-api';

/** Studio logout — clears tokens and reloads on the login page. */
export async function handleLogout(redirectTo = '/login'): Promise<void> {
  ensureApiConfigured();
  await signOut(redirectTo);
}
