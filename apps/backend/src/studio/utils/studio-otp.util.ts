import { randomInt } from 'crypto';
import { hashPassword, verifyPassword } from './password-crypto';

export function generateNumericOtp(length = 6): string {
  const max = 10 ** length;
  const min = 10 ** (length - 1);
  return String(randomInt(min, max));
}

export async function hashOtp(otp: string, pepper: string): Promise<string> {
  return hashPassword(otp, pepper);
}

export async function verifyOtp(
  otp: string,
  pepper: string,
  storedHash: string,
): Promise<boolean> {
  return verifyPassword(otp, pepper, storedHash);
}
