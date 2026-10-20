// HMAC, random identifiers and constant-time comparison (Web Crypto, available in Workers).

const encoder = new TextEncoder();

export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = '';
  for (const b of view) out += b.toString(16).padStart(2, '0');
  return out;
}

export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

/**
 * Compares two strings without leaking where they differ: both are hashed first, so the loop always runs over
 * 32 bytes whatever the input lengths are.
 */
export async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/** 32 hex characters (128 random bits). */
export function randomRunId(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

export const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** 8 characters from CODE_ALPHABET. 32 symbols divide 256, so `byte & 31` is uniform. */
export function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let out = '';
  for (const b of bytes) out += CODE_ALPHABET[b & 31];
  return out;
}
