// Public quest endpoints (/api/quest/start|step|finish|code). A run is a random id plus an HMAC token the browser keeps;
// the server stores only the run id, a hashed IP for the start limit and timestamps (milliseconds since 1970).
//
// Rules (Docs/WEB_AR_QUEST.md): at most 30 starts per IP and hour; steps 1..5 strictly in order, each at least 10 s
// after the previous one (step 1 after the start); finish needs all five steps, at least 90 s and at most 2 h since the
// start; one redemption code per finished run, a repeated call returns the same code.

import type { Ctx, Env } from './env';
import { HttpError, assertSameOrigin, field, json, notConfigured, readObject } from './http';
import { constantTimeEqual, hmacHex, randomCode, randomRunId } from './crypto';

export const REWARD_ITEM = 'GoldenDeagle';
const STEPS = 5;
const STEP_GAP_MS = 10_000;
const MIN_RUN_MS = 90_000;
const MAX_RUN_MS = 2 * 60 * 60 * 1000;
const KEEP_RUNS_MS = 7 * 24 * 60 * 60 * 1000;
const STARTS_PER_HOUR = 30;
const HOUR_MS = 60 * 60 * 1000;

export const RUN_PATTERN = /^[0-9a-f]{32}$/;
export const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export interface RunRow {
  run: string;
  started_at: number;
  step: number;
  step_at: number | null;
  finished_at: number | null;
}

export function runToken(env: Env, run: string): Promise<string> {
  return hmacHex(env.QUEST_SECRET!, `run:${run}`);
}

/**
 * HMAC of the client IP with a salt that changes every UTC day (derived from QUEST_SECRET), so stored hashes cannot be
 * linked across days or reversed without the secret. Only used for the start limit.
 */
async function ipHash(env: Env, request: Request, now: number): Promise<string> {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const day = new Date(now).toISOString().slice(0, 10);
  const salt = await hmacHex(env.QUEST_SECRET!, `ip-salt:${day}`);
  return hmacHex(salt, ip);
}

/** Validates run + token and returns the stored run, or throws 400/403/404. */
export async function loadRun(env: Env, run: string, token: string): Promise<RunRow> {
  if (!(await constantTimeEqual(token, await runToken(env, run)))) throw new HttpError(403, 'invalid_token');
  const row = await env.DB!.prepare('SELECT run, started_at, step, step_at, finished_at FROM quest_runs WHERE run = ?')
    .bind(run)
    .first<RunRow>();
  if (!row) throw new HttpError(404, 'unknown_run');
  return row;
}

async function readRun(env: Env, request: Request): Promise<{ body: Record<string, unknown>; row: RunRow }> {
  assertSameOrigin(request);
  const body = await readObject(request);
  const run = field(body, 'run', RUN_PATTERN);
  const token = field(body, 'token', TOKEN_PATTERN);
  return { body, row: await loadRun(env, run, token) };
}

async function start(env: Env, request: Request, ctx: Ctx): Promise<Response> {
  assertSameOrigin(request);
  const now = Date.now();
  const hash = await ipHash(env, request, now);
  const recent = await env.DB!.prepare('SELECT COUNT(*) AS n FROM quest_runs WHERE ip_hash = ? AND started_at > ?')
    .bind(hash, now - HOUR_MS)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= STARTS_PER_HOUR) return json({ ok: false, error: 'rate_limited' }, 429, { 'retry-after': '3600' });

  const run = randomRunId();
  await env.DB!.prepare('INSERT INTO quest_runs (run, ip_hash, started_at, step, step_at, finished_at) VALUES (?, ?, ?, 0, NULL, NULL)')
    .bind(run, hash, now)
    .run();
  // Housekeeping off the response path: runs older than 7 days are deleted.
  ctx.waitUntil(env.DB!.prepare('DELETE FROM quest_runs WHERE started_at < ?').bind(now - KEEP_RUNS_MS).run().catch(() => undefined));
  return json({ run, token: await runToken(env, run) });
}

async function step(env: Env, request: Request): Promise<Response> {
  const { body, row } = await readRun(env, request);
  const value = body.step;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > STEPS) throw new HttpError(400, 'invalid_step');
  const now = Date.now();
  if (row.finished_at !== null) throw new HttpError(409, 'already_finished');
  if (now - row.started_at > MAX_RUN_MS) throw new HttpError(409, 'expired');
  // Repeating the step that was just accepted (lost answer, retry) is fine.
  if (value === row.step) return json({ ok: true });
  if (value !== row.step + 1) throw new HttpError(409, 'out_of_order');
  const previous = row.step_at ?? row.started_at;
  if (now - previous < STEP_GAP_MS) {
    return json({ ok: false, error: 'too_early', wait: STEP_GAP_MS - (now - previous) }, 409);
  }
  // Guarded update: two parallel requests for the same step cannot both advance the run.
  const result = await env.DB!.prepare('UPDATE quest_runs SET step = ?, step_at = ? WHERE run = ? AND step = ? AND finished_at IS NULL')
    .bind(value, now, row.run, row.step)
    .run();
  if (result.meta.changes !== 1) throw new HttpError(409, 'out_of_order');
  return json({ ok: true });
}

async function finish(env: Env, request: Request): Promise<Response> {
  const { row } = await readRun(env, request);
  if (row.finished_at !== null) return json({ ok: true });
  const now = Date.now();
  if (row.step !== STEPS) throw new HttpError(409, 'steps_missing');
  const age = now - row.started_at;
  if (age < MIN_RUN_MS) return json({ ok: false, error: 'too_early', wait: MIN_RUN_MS - age }, 409);
  if (age > MAX_RUN_MS) throw new HttpError(409, 'expired');
  await env.DB!.prepare('UPDATE quest_runs SET finished_at = ? WHERE run = ? AND finished_at IS NULL').bind(now, row.run).run();
  return json({ ok: true });
}

async function code(env: Env, request: Request): Promise<Response> {
  const { row } = await readRun(env, request);
  if (row.finished_at === null) throw new HttpError(409, 'not_finished');
  const existing = await env.DB!.prepare('SELECT code FROM codes WHERE run = ?').bind(row.run).first<{ code: string }>();
  if (existing) return json({ code: existing.code });
  // A fresh code collides with an existing one with negligible probability (32^8); retry a few times anyway.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await env.DB!.prepare('INSERT INTO codes (code, item, run, created_at, redeemed_by, redeemed_at) VALUES (?, ?, ?, ?, NULL, NULL) ON CONFLICT(run) DO NOTHING')
        .bind(randomCode(), REWARD_ITEM, row.run, Date.now())
        .run();
    } catch {
      continue; // primary key (code) taken
    }
    const stored = await env.DB!.prepare('SELECT code FROM codes WHERE run = ?').bind(row.run).first<{ code: string }>();
    if (stored) return json({ code: stored.code });
  }
  throw new Error('code generation failed');
}

export async function handleQuest(path: string, request: Request, env: Env, ctx: Ctx): Promise<Response> {
  if (!env.DB || !env.QUEST_SECRET) return notConfigured();
  if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
  switch (path) {
    case '/api/quest/start':
      return start(env, request, ctx);
    case '/api/quest/step':
      return step(env, request);
    case '/api/quest/finish':
      return finish(env, request);
    case '/api/quest/code':
      return code(env, request);
    default:
      throw new HttpError(404, 'not_found');
  }
}
