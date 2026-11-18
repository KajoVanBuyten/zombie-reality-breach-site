import type { Env, D1Database } from './env';
import { HttpError, json, readObject } from './http';
import { constantTimeEqual, hmacHex, randomRunId } from './crypto';
import { EVENTS, CONSENT_VERSION, RETENTION_DAYS, campaignSlug, pagePath } from '../shared/analytics';

const ID = /^[a-f0-9]{32}$/;
const noStore = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };
function origin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new HttpError(403, 'same_origin_required');
}
async function throttle(request: Request, env: Env, scope: string) {
  if (env.ANALYTICS_LIMITER) {
    // IP is used transiently by Cloudflare's rate limiter, never written to the analytics database.
    const result = await env.ANALYTICS_LIMITER.limit({ key: scope + ':' + (request.headers.get('cf-connecting-ip') ?? 'local') });
    if (!result.success) throw new HttpError(429, 'rate_limited');
  }
}
function classification(request: Request) {
  const ua = request.headers.get('user-agent') ?? '';
  const device = /OculusBrowser|Quest/i.test(ua) ? 'quest' : /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobile|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop';
  const browser = /OculusBrowser/i.test(ua) ? 'quest' : /Edg\//.test(ua) ? 'edge' : /Firefox\//.test(ua) ? 'firefox' : /Chrome|CriOS/.test(ua) ? 'chrome' : /Safari/.test(ua) ? 'safari' : 'other';
  const country = (request as Request & { cf?: { country?: string } }).cf?.country ?? 'XX';
  return { device, browser, country: /^[A-Z]{2}$/.test(country) ? country : 'XX' };
}
async function tokenValid(token: unknown, secret: string): Promise<string | null> {
  if (typeof token !== 'string' || token.length > 160) return null;
  if (token.split('.').length !== 3) return null;
  const [session, expires, signature] = token.split('.');
  if (!ID.test(session) || !/^\d{13}$/.test(expires) || !/^[a-f0-9]{64}$/.test(signature ?? '')) return null;
  const expiry = Number(expires);
  if (expiry < Date.now() || expiry > Date.now() + 24 * 3600_000) return null;
  return await constantTimeEqual(signature, await hmacHex(secret, 'analytics:' + session + '.' + expires)) ? session : null;
}
async function requireAdmin(request: Request, env: Env) {
  const auth = request.headers.get('authorization') ?? '';
  if (!env.ANALYTICS_ADMIN_KEY || !await constantTimeEqual(auth, 'Bearer ' + env.ANALYTICS_ADMIN_KEY)) throw new HttpError(401, 'unauthorized');
}
export async function cleanupAnalytics(db: D1Database) {
  await db.prepare('DELETE FROM analytics_events WHERE at < ?').bind(Date.now() - RETENTION_DAYS * 86400_000).run();
  await db.prepare("DELETE FROM analytics_budget WHERE day < date('now', '-90 days')").run();
}
export async function handleAnalytics(path: string, request: Request, env: Env): Promise<Response> {
  if (!env.ANALYTICS_DB || !env.ANALYTICS_SECRET) throw new HttpError(503, 'analytics_not_configured');
  const db = env.ANALYTICS_DB;
  if (path === '/api/analytics/report' && request.method === 'GET') {
    await throttle(request, env, 'report');
    await requireAdmin(request, env);
    const url = new URL(request.url);
    const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 7));
    const until = Date.now();
    const since = until - days * 86400_000;
    const query = (sql: string) => db.prepare(sql).bind(since, until);
    const result = await db.batch([
      query("SELECT COUNT(*) events, COUNT(DISTINCT session) sessions, SUM(name='page_view') page_views, COUNT(DISTINCT CASE WHEN name='beta_click' THEN session END) beta_sessions, COUNT(DISTINCT CASE WHEN name='engaged' THEN session END) engaged_sessions FROM analytics_events WHERE at >= ? AND at <= ?"),
      query("SELECT date(at/1000,'unixepoch') day, COUNT(DISTINCT session) sessions, SUM(name='page_view') page_views, COUNT(DISTINCT CASE WHEN name='beta_click' THEN session END) beta_sessions FROM analytics_events WHERE at >= ? AND at <= ? GROUP BY day ORDER BY day"),
      query("SELECT source,medium,campaign,content, COUNT(DISTINCT session) sessions, SUM(name='page_view') page_views, COUNT(DISTINCT CASE WHEN name='beta_click' THEN session END) beta_sessions FROM analytics_events WHERE at >= ? AND at <= ? GROUP BY source,medium,campaign,content ORDER BY sessions DESC LIMIT 200"),
      query("SELECT path, COUNT(DISTINCT session) sessions, SUM(name='page_view') page_views, SUM(name='beta_click') beta_clicks FROM analytics_events WHERE at >= ? AND at <= ? GROUP BY path ORDER BY page_views DESC LIMIT 100"),
      query("SELECT name,target,value,COUNT(*) count,COUNT(DISTINCT session) sessions FROM analytics_events WHERE at >= ? AND at <= ? GROUP BY name,target,value ORDER BY count DESC LIMIT 200"),
      query("SELECT device,browser,country,language,COUNT(DISTINCT session) sessions FROM analytics_events WHERE at >= ? AND at <= ? GROUP BY device,browser,country,language ORDER BY sessions DESC LIMIT 100"),
    ]);
    const previous = await db.prepare("SELECT COUNT(DISTINCT session) sessions, SUM(name='page_view') page_views, COUNT(DISTINCT CASE WHEN name='beta_click' THEN session END) beta_sessions FROM analytics_events WHERE at >= ? AND at < ?").bind(since - days * 86400_000, since).first();
    let game: unknown = null;
    if (env.DB) {
      try { game = await env.DB.prepare('SELECT COUNT(*) reporting_installations, SUM(first_seen >= ?) first_reports_in_period, SUM(last_seen >= ?) active_installations_in_period, SUM(last_seen >= ?) online_installations FROM live_players').bind(since, since, until - 150_000).first(); }
      catch { /* Game telemetry is independent; unavailable is not zero. */ }
    }
    const budget = await db.prepare('SELECT COALESCE(SUM(events),0) events FROM analytics_budget WHERE day = ?').bind(new Date(until).toISOString().slice(0,10)).first();
    return json({ generatedAt: new Date(until).toISOString(), days, retentionDays: RETENTION_DAYS, consentVersion: CONSENT_VERSION, totals: result[0].results?.[0], daily: result[1].results, campaigns: result[2].results, pages: result[3].results, events: result[4].results, audience: result[5].results, previous, game, dailyBudget: { used: (budget as { events?: number })?.events ?? 0, limit: 10000 }, note: 'Consented browser sessions, not unique people. Beta clicks are outbound clicks, not confirmed joins. No attribution of game activity to website sessions.' });
  }
  if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
  origin(request);
  await throttle(request, env, 'collect');
  if (request.headers.get('sec-gpc') === '1' || request.headers.get('dnt') === '1' || /bot|spider|crawler|headless/i.test(request.headers.get('user-agent') ?? '')) return new Response(null, { status: 204, headers: noStore });
  const body = await readObject(request);
  if (body.consent !== CONSENT_VERSION) throw new HttpError(400, 'consent_required');
  if (path === '/api/analytics/session') {
    const session = randomRunId();
    const expires = Date.now() + 24 * 3600_000;
    const payload = session + '.' + expires;
    return json({ session, token: payload + '.' + await hmacHex(env.ANALYTICS_SECRET, 'analytics:' + payload) });
  }
  if (path !== '/api/analytics/events') throw new HttpError(404, 'not_found');
  const session = await tokenValid(body.token, env.ANALYTICS_SECRET);
  if (!session) throw new HttpError(401, 'invalid_session');
  if (!Array.isArray(body.events) || body.events.length < 1 || body.events.length > 10) throw new HttpError(400, 'invalid_batch');
  const attribution = body.attribution && typeof body.attribution === 'object' ? body.attribution as Record<string, unknown> : {};
  const source = campaignSlug(attribution.source) || 'direct';
  const medium = campaignSlug(attribution.medium) || 'none';
  const campaign = campaignSlug(attribution.campaign);
  const content = campaignSlug(attribution.content);
  const { device, browser, country } = classification(request);
  const now = Date.now();
  const quota = await db.prepare('SELECT COUNT(*) n FROM analytics_events WHERE session = ?').bind(session).first<{ n: number }>();
  if ((quota?.n ?? 0) + body.events.length > 500) throw new HttpError(429, 'session_limit');
  const statements = body.events.map((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new HttpError(400, 'invalid_event');
    const event = raw as Record<string, unknown>;
    if (typeof event.id !== 'string' || !ID.test(event.id) || !EVENTS.includes(event.name as typeof EVENTS[number])) throw new HttpError(400, 'invalid_event');
    const target = campaignSlug(event.target);
    const value = typeof event.value === 'number' && Number.isFinite(event.value) ? Math.min(100, Math.max(0, Math.floor(event.value))) : 0;
    const language = event.language === 'de' ? 'de' : 'en';
    return db.prepare('INSERT OR IGNORE INTO analytics_events (id,session,at,name,path,target,value,language,source,medium,campaign,content,device,browser,country,consent_version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(event.id, session, now, event.name, pagePath(event.path), target, value, language, source, medium, campaign, content, device, browser, country, CONSENT_VERSION);
  });
  await db.batch(statements);
  return json({ ok: true });
}
