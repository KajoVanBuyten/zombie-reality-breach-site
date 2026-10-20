// Meta account linking for the quest reward (/api/meta/link, /api/meta/claim).
//
// link:  a finished run sends the browser to Meta's SSO page; the run rides along in a short-lived HttpOnly cookie.
// claim: /breach/linked posts the base64 JSON Meta appended to the redirect ({ code, org_scoped_id }). The worker trades
//        the code for an OAuth token (graph.oculus.com/sso_authorize_code with OC|APP_ID|APP_SECRET), asks /me for the
//        id and writes the reward only when that id equals org_scoped_id. Token, refresh code and alias are never stored
//        or logged; only the org-scoped id lands in `rewards`.

import type { Env } from './env';
import { HttpError, assertSameOrigin, cookie, field, json, notConfigured, readObject } from './http';
import { REWARD_ITEM, RUN_PATTERN, TOKEN_PATTERN, loadRun } from './quest';

const REDIRECT_URI = 'https://zombierealitybreach.com/breach/linked';
const SSO_URL = 'https://auth.oculus.com/sso/';
const GRAPH = 'https://graph.oculus.com';
const COOKIE = 'zrb_run';
const COOKIE_SECONDS = 15 * 60;
const META_TIMEOUT_MS = 10_000;

export const ORG_SCOPED_ID_PATTERN = /^[0-9]{1,32}$/;
const PAYLOAD_PATTERN = /^[A-Za-z0-9+/_-]{8,4000}={0,2}$/;
const AUTH_CODE_PATTERN = /^[\x21-\x7e]{1,2048}$/;

function configured(env: Env): boolean {
  return Boolean(env.DB && env.QUEST_SECRET && env.META_APP_ID && env.META_APP_SECRET && env.META_ORG_ID && /^[0-9]{1,32}$/.test(env.META_ORG_ID));
}

function runCookie(value: string, maxAge: number): string {
  return `${COOKIE}=${value}; Path=/api/meta; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

async function link(env: Env, request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const run = params.get('run') ?? '';
  const token = params.get('token') ?? '';
  if (!RUN_PATTERN.test(run)) throw new HttpError(400, 'invalid_run');
  if (!TOKEN_PATTERN.test(token)) throw new HttpError(400, 'invalid_token');
  const row = await loadRun(env, run, token);
  if (row.finished_at === null) throw new HttpError(409, 'not_finished');
  const target = `${SSO_URL}?redirect_uri=${encodeURIComponent(REDIRECT_URI)}&organization_id=${env.META_ORG_ID}`;
  return new Response(null, {
    status: 302,
    headers: { location: target, 'cache-control': 'no-store', 'set-cookie': runCookie(`${run}.${token}`, COOKIE_SECONDS) },
  });
}

/** Meta's fragment is standard base64; tolerate the URL-safe alphabet and missing padding. */
function decodePayload(payload: string): { code: string; orgScopedId: string } {
  let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  let parsed: unknown;
  try {
    parsed = JSON.parse(atob(b64));
  } catch {
    throw new HttpError(400, 'invalid_payload');
  }
  if (!parsed || typeof parsed !== 'object') throw new HttpError(400, 'invalid_payload');
  const data = parsed as Record<string, unknown>;
  const code = data.code;
  const id = data.org_scoped_id;
  const orgScopedId = typeof id === 'number' && Number.isSafeInteger(id) ? String(id) : id;
  if (typeof code !== 'string' || !AUTH_CODE_PATTERN.test(code)) throw new HttpError(400, 'invalid_payload');
  if (typeof orgScopedId !== 'string' || !ORG_SCOPED_ID_PATTERN.test(orgScopedId)) throw new HttpError(400, 'invalid_payload');
  return { code, orgScopedId };
}

/** Verifies the code with Meta and returns the confirmed org-scoped id. Errors carry only HTTP status codes. */
async function verifyWithMeta(env: Env, code: string, orgScopedId: string): Promise<string> {
  const appToken = `OC|${env.META_APP_ID}|${env.META_APP_SECRET}`;
  const authorize = new URL(`${GRAPH}/sso_authorize_code`);
  authorize.searchParams.set('code', code);
  authorize.searchParams.set('access_token', appToken);
  authorize.searchParams.set('org_scoped_id', orgScopedId);
  const tokenResponse = await fetch(authorize.toString(), { method: 'POST', signal: AbortSignal.timeout(META_TIMEOUT_MS) });
  if (!tokenResponse.ok) {
    console.error('meta sso_authorize_code failed', tokenResponse.status);
    throw new HttpError(tokenResponse.status >= 500 ? 502 : 403, 'meta_rejected');
  }
  const tokenBody = (await tokenResponse.json().catch(() => null)) as { oauth_token?: unknown } | null;
  const oauthToken = tokenBody?.oauth_token;
  if (typeof oauthToken !== 'string' || !oauthToken) throw new HttpError(502, 'meta_failed');

  const me = new URL(`${GRAPH}/me`);
  me.searchParams.set('access_token', oauthToken);
  me.searchParams.set('fields', 'id');
  const meResponse = await fetch(me.toString(), { signal: AbortSignal.timeout(META_TIMEOUT_MS) });
  if (!meResponse.ok) {
    console.error('meta /me failed', meResponse.status);
    throw new HttpError(502, 'meta_failed');
  }
  const meBody = (await meResponse.json().catch(() => null)) as { id?: unknown } | null;
  return typeof meBody?.id === 'string' ? meBody.id : typeof meBody?.id === 'number' ? String(meBody.id) : '';
}

async function claim(env: Env, request: Request): Promise<Response> {
  assertSameOrigin(request);
  const body = await readObject(request);
  const payload = field(body, 'payload', PAYLOAD_PATTERN);
  const ticket = cookie(request, COOKIE) ?? '';
  const [run, token] = ticket.split('.');
  if (!run || !token || !RUN_PATTERN.test(run) || !TOKEN_PATTERN.test(token)) throw new HttpError(401, 'no_run');
  const row = await loadRun(env, run, token);
  if (row.finished_at === null) throw new HttpError(409, 'not_finished');

  const { code, orgScopedId } = decodePayload(payload);
  const confirmed = await verifyWithMeta(env, code, orgScopedId);
  if (confirmed !== orgScopedId) throw new HttpError(403, 'mismatch');

  // One reward per Meta account: a second claim keeps the first row and reports already = true.
  const result = await env.DB!.prepare('INSERT INTO rewards (org_scoped_id, item, earned_at, claimed_at) VALUES (?, ?, ?, NULL) ON CONFLICT(org_scoped_id) DO NOTHING')
    .bind(orgScopedId, REWARD_ITEM, Date.now())
    .run();
  return json({ ok: true, already: result.meta.changes === 0 }, 200, { 'set-cookie': runCookie('', 0) });
}

export async function handleMeta(path: string, request: Request, env: Env): Promise<Response> {
  if (!configured(env)) return notConfigured();
  if (path === '/api/meta/link') {
    if (request.method !== 'GET') throw new HttpError(405, 'method_not_allowed');
    return link(env, request);
  }
  if (path === '/api/meta/claim') {
    if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
    return claim(env, request);
  }
  throw new HttpError(404, 'not_found');
}
