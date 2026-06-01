import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export const API_KEY_PREFIX_LABEL = 'aco_';

export function generateApiKeySecret(): string {
  return `${API_KEY_PREFIX_LABEL}${randomBytes(24).toString('base64url')}`;
}

export function extractKeyPrefix(rawKey: string): string {
  return rawKey.slice(0, 12);
}

export async function hashApiKey(
  rawKey: string,
  pepper: string,
): Promise<string> {
  const derived = (await scryptAsync(rawKey, pepper, 32)) as Buffer;
  return derived.toString('hex');
}

export async function verifyApiKey(
  rawKey: string,
  pepper: string,
  storedHash: string,
): Promise<boolean> {
  const computed = await hashApiKey(rawKey, pepper);
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
