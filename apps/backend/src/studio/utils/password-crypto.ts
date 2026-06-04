import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export async function hashPassword(
  password: string,
  pepper: string,
): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(`${password}${pepper}`, salt, 32)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  pepper: string,
  stored: string,
): Promise<boolean> {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) {
    return false;
  }
  const derived = (await scryptAsync(`${password}${pepper}`, salt, 32)) as Buffer;
  const a = derived;
  const b = Buffer.from(hashHex, 'hex');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
