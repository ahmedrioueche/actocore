import { createHmac, timingSafeEqual } from 'node:crypto';

export type PlaygroundTokenPayload = {
  visitorId: string;
  projectId: string;
  exp: number;
};

function encodePayload(payload: PlaygroundTokenPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodePayload(encoded: string): PlaygroundTokenPayload | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as PlaygroundTokenPayload;
    if (
      !parsed ||
      typeof parsed.visitorId !== 'string' ||
      typeof parsed.projectId !== 'string' ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function sign(encoded: string, secret: string): string {
  return createHmac('sha256', secret).update(encoded).digest('base64url');
}

export function createPlaygroundToken(
  payload: Omit<PlaygroundTokenPayload, 'exp'>,
  secret: string,
  ttlDays: number,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60;
  const full: PlaygroundTokenPayload = { ...payload, exp };
  const encoded = encodePayload(full);
  return `pg_${encoded}.${sign(encoded, secret)}`;
}

export function verifyPlaygroundToken(
  token: string,
  secret: string,
): PlaygroundTokenPayload | null {
  if (!token.startsWith('pg_')) {
    return null;
  }

  const raw = token.slice(3);
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) {
    return null;
  }

  const encoded = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  const expected = sign(encoded, secret);

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  const payload = decodePayload(encoded);
  if (!payload || payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}
