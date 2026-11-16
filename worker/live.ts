// Live player numbers for the home page (owner 2026-11-16). The game (LivePresence.cs in the game repo) reports:
//   POST /api/live/ping    { id, mode }                      every minute while the app runs and is in front
//   POST /api/live/round   { id, run, mode, role, kills, wave }  once per closed round
//   POST /api/live/forget  { id }                            when the player deletes their online data
// and the home page reads
//   GET  /api/live/stats   { online, players, rounds, zombies }   cached 30 s per data center
// id is a random installation ID (32 hex characters) the game makes for this alone; no IP address is stored.

import type { Ctx, Env } from './env';
import { HttpError, field, json, notConfigured, readObject } from './http';

const ID = /^[a-f0-9]{32}$/;
const RUN = /^[a-f0-9]{8,32}$/;
const MODE = /^[a-z0-9_-]{1,24}$/;
const ROLES = new Set(['solo', 'host', 'guest']);
/** A sign of life comes every 60 s; a player counts as playing for two and a half of them. */
const ONLINE_MS = 150_000;
const CACHE_SECONDS = 30;
/** Plausible upper ends; anything above is cut, not trusted. */
const MAX_KILLS = 5000;
const MAX_WAVE = 999;

function wholeNumber(body: Record<string, unknown>, name: string, max: number): number {
  const value = body[name];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new HttpError(400, `invalid_${name}`);
  return Math.min(max, Math.floor(value));
}

async function ping(env: Env, body: Record<string, unknown>): Promise<Response> {
  const id = field(body, 'id', ID);
  const mode = field(body, 'mode', MODE);
  const now = Date.now();
  await env.DB!.prepare(
    'INSERT INTO live_players (id, first_seen, last_seen, mode) VALUES (?1, ?2, ?2, ?3) ' +
      'ON CONFLICT(id) DO UPDATE SET last_seen = ?2, mode = ?3',
  )
    .bind(id, now, mode)
    .run();
  return json({ ok: true });
}

async function round(env: Env, body: Record<string, unknown>): Promise<Response> {
  const id = field(body, 'id', ID);
  const run = field(body, 'run', RUN);
  const mode = field(body, 'mode', MODE);
  const role = field(body, 'role', MODE);
  if (!ROLES.has(role)) throw new HttpError(400, 'invalid_role');
  const kills = wholeNumber(body, 'kills', MAX_KILLS);
  const wave = wholeNumber(body, 'wave', MAX_WAVE);
  const now = Date.now();
  // The same run reported twice (a retry) counts once.
  await env.DB!.batch([
    env.DB!.prepare('INSERT OR IGNORE INTO live_rounds (run, player, mode, role, kills, wave, at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(run, id, mode, role, kills, wave, now),
    env.DB!.prepare(
      'INSERT INTO live_players (id, first_seen, last_seen, mode) VALUES (?1, ?2, ?2, ?3) ON CONFLICT(id) DO UPDATE SET last_seen = ?2',
    ).bind(id, now, mode),
  ]);
  return json({ ok: true });
}

/** The player deleted their online data: their installation ID goes, the rounds stay as counts without it. */
async function forget(env: Env, body: Record<string, unknown>): Promise<Response> {
  const id = field(body, 'id', ID);
  await env.DB!.batch([
    env.DB!.prepare('DELETE FROM live_players WHERE id = ?').bind(id),
    env.DB!.prepare("UPDATE live_rounds SET player = '-' WHERE player = ?").bind(id),
  ]);
  return json({ ok: true });
}

interface Totals {
  online: number;
  players: number;
  rounds: number;
  zombies: number;
}

async function totals(env: Env): Promise<Totals> {
  const db = env.DB!;
  const [online, players, rounds, settings] = await db.batch([
    db.prepare('SELECT COUNT(*) AS n FROM live_players WHERE last_seen >= ?').bind(Date.now() - ONLINE_MS),
    db.prepare('SELECT COUNT(*) AS n FROM live_players'),
    db.prepare("SELECT SUM(CASE WHEN role <> 'guest' THEN 1 ELSE 0 END) AS n, COALESCE(SUM(kills), 0) AS k FROM live_rounds"),
    db.prepare("SELECT key, value FROM live_settings WHERE key IN ('players_base', 'rounds_base', 'zombies_base')"),
  ]);
  const first = (r: { results?: unknown[] }) => (r.results?.[0] ?? {}) as Record<string, number | null>;
  const base: Record<string, number> = {};
  for (const row of (settings.results ?? []) as { key: string; value: number }[]) base[row.key] = row.value;
  return {
    online: first(online).n ?? 0,
    players: (first(players).n ?? 0) + (base.players_base ?? 0),
    rounds: (first(rounds).n ?? 0) + (base.rounds_base ?? 0),
    zombies: (first(rounds).k ?? 0) + (base.zombies_base ?? 0),
  };
}

async function stats(request: Request, env: Env, ctx: Ctx): Promise<Response> {
  const url = new URL(request.url);
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(`${url.origin}/api/live/stats?cache=1`);
  const hit = await cache.match(key);
  if (hit) return hit;
  const response = json(await totals(env), 200, { 'cache-control': `public, max-age=${CACHE_SECONDS}` });
  ctx.waitUntil(cache.put(key, response.clone()));
  return response;
}

export async function handleLive(path: string, request: Request, env: Env, ctx: Ctx): Promise<Response> {
  if (!env.DB) return notConfigured();
  if (path === '/api/live/stats') {
    if (request.method !== 'GET') throw new HttpError(405, 'method_not_allowed');
    return stats(request, env, ctx);
  }

  // Only the game posts here; a browser on another site may not (no CORS headers are sent).
  if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
  if (request.headers.get('origin')) throw new HttpError(403, 'forbidden_origin');
  const body = await readObject(request);
  switch (path) {
    case '/api/live/ping':
      return ping(env, body);
    case '/api/live/round':
      return round(env, body);
    case '/api/live/forget':
      return forget(env, body);
    default:
      throw new HttpError(404, 'not_found');
  }
}
