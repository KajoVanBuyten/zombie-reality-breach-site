// Server-to-server endpoints for the game's Cloud Code script "claimWebRewards" (/api/rewards/claim|redeem|forget).
// Every call needs `Authorization: Bearer <WEB_REWARDS_KEY>`; the key is compared in constant time.

import type { Env } from './env';
import { HttpError, field, json, notConfigured, optionalField, readObject } from './http';
import { CODE_ALPHABET, constantTimeEqual } from './crypto';
import { ORG_SCOPED_ID_PATTERN } from './meta';

const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{8}$`);
/** Unity player ids are short alphanumeric strings; allow the usual id characters and nothing else. */
const PLAYER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
/** redeemed_by of a code whose player asked for data deletion: the code stays used, the player id is gone. */
const FORGOTTEN = '-';

async function authorized(env: Env, request: Request): Promise<boolean> {
  const header = request.headers.get('authorization') ?? '';
  const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
  return constantTimeEqual(presented, env.WEB_REWARDS_KEY!);
}

async function claim(env: Env, body: Record<string, unknown>): Promise<Response> {
  const orgScopedId = field(body, 'orgScopedId', ORG_SCOPED_ID_PATTERN);
  const row = await env.DB!.prepare('SELECT item FROM rewards WHERE org_scoped_id = ?').bind(orgScopedId).first<{ item: string }>();
  if (!row) return json({ items: [] });
  await env.DB!.prepare('UPDATE rewards SET claimed_at = COALESCE(claimed_at, ?) WHERE org_scoped_id = ?').bind(Date.now(), orgScopedId).run();
  return json({ items: [row.item] });
}

async function redeem(env: Env, body: Record<string, unknown>): Promise<Response> {
  const code = field(body, 'code', CODE_PATTERN);
  const playerId = field(body, 'playerId', PLAYER_ID_PATTERN);
  // Atomic: only the first player to redeem a free code wins it.
  const taken = await env.DB!.prepare('UPDATE codes SET redeemed_by = ?, redeemed_at = ? WHERE code = ? AND redeemed_by IS NULL')
    .bind(playerId, Date.now(), code)
    .run();
  const row = await env.DB!.prepare('SELECT item, redeemed_by FROM codes WHERE code = ?').bind(code).first<{ item: string; redeemed_by: string | null }>();
  if (!row) return json({ ok: false, reason: 'unknown' });
  if (taken.meta.changes === 1 || row.redeemed_by === playerId) return json({ ok: true, item: row.item });
  return json({ ok: false, reason: 'used' });
}

async function forget(env: Env, body: Record<string, unknown>): Promise<Response> {
  const orgScopedId = optionalField(body, 'orgScopedId', ORG_SCOPED_ID_PATTERN);
  const playerId = optionalField(body, 'playerId', PLAYER_ID_PATTERN);
  if (!orgScopedId && !playerId) throw new HttpError(400, 'invalid_input');
  const statements = [];
  if (orgScopedId) statements.push(env.DB!.prepare('DELETE FROM rewards WHERE org_scoped_id = ?').bind(orgScopedId));
  if (playerId) statements.push(env.DB!.prepare('UPDATE codes SET redeemed_by = ? WHERE redeemed_by = ?').bind(FORGOTTEN, playerId));
  await env.DB!.batch(statements);
  return json({ ok: true });
}

export async function handleRewards(path: string, request: Request, env: Env): Promise<Response> {
  if (!env.DB || !env.WEB_REWARDS_KEY) return notConfigured();
  if (!(await authorized(env, request))) return json({ ok: false, error: 'unauthorized' }, 401, { 'www-authenticate': 'Bearer' });
  if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
  const body = await readObject(request);
  switch (path) {
    case '/api/rewards/claim':
      return claim(env, body);
    case '/api/rewards/redeem':
      return redeem(env, body);
    case '/api/rewards/forget':
      return forget(env, body);
    default:
      throw new HttpError(404, 'not_found');
  }
}
