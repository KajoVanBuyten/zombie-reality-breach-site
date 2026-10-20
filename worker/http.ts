// Small response and request helpers shared by the API modules. Every API answer is JSON and never cached.

const NO_STORE = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const MAX_BODY = 4096;

export function json(body: unknown, status = 200, extra?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...NO_STORE, ...extra } });
}

/** Error answer with a stable machine-readable code; the page maps codes to texts. */
export function fail(status: number, error: string, extra?: Record<string, unknown>): Response {
  return json({ ok: false, error, ...extra }, status);
}

/** A required binding, variable or secret is missing: the feature is not set up yet. */
export function notConfigured(): Response {
  return json({ ok: false, configured: false, error: 'not_configured' }, 503);
}

/** Thrown by the helpers below and turned into a 4xx answer by the router. */
export class HttpError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
  }
}

/** Reads a small JSON object body. Anything else (too big, not JSON, not an object) is a 400. */
export async function readObject(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get('content-type') ?? '';
  if (!type.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'json_required');
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY) throw new HttpError(413, 'too_large');
  const text = await request.text();
  if (text.length > MAX_BODY) throw new HttpError(413, 'too_large');
  let value: unknown;
  try {
    value = text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'invalid_json');
  return value as Record<string, unknown>;
}

/** A string field matching `pattern`, or a 400. */
export function field(body: Record<string, unknown>, name: string, pattern: RegExp): string {
  const value = body[name];
  if (typeof value !== 'string' || !pattern.test(value)) throw new HttpError(400, `invalid_${name}`);
  return value;
}

/** Optional string field: absent/null is undefined, a present but malformed value is a 400. */
export function optionalField(body: Record<string, unknown>, name: string, pattern: RegExp): string | undefined {
  const value = body[name];
  if (value === undefined || value === null) return undefined;
  return field(body, name, pattern);
}

/**
 * Browser POSTs must come from this site. Requests without an Origin header (server tools) pass; the cookie of
 * /api/meta/claim is SameSite=Lax, so a foreign page cannot ride on it either way.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, 'forbidden_origin');
}

export function cookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return undefined;
}
