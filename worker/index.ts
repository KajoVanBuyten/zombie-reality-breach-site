// Worker in front of the static site: /api/leaderboards reads the top scores of every game leaderboard from Unity
// Gaming Services (Leaderboards Admin API, service account), everything else is the built site (dist/).
//
// Secrets (set by the owner, never in the repo): UGS_KEY_ID, UGS_SECRET - a service account with read access to
// leaderboard scores. UGS_ENVIRONMENT_ID is optional; without it the "production" environment is looked up.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  UGS_KEY_ID?: string;
  UGS_SECRET?: string;
  UGS_ENVIRONMENT_ID?: string;
}

const PROJECT_ID = 'bf11c935-fdc3-4484-98c3-19038ec00bec';
const API = 'https://services.api.unity.com';
const MODES = ['room', 'rift', 'rooftop', 'safezone', 'gasstation'];
const DIFFICULTIES = ['easy', 'hard'];
const TEAMS = ['solo', 'coop'];
const TOP = 10;
const CACHE_SECONDS = 600;

interface Row {
  rank: number;
  name: string;
  score: number;
  wave?: number;
  kills?: number;
  team?: string;
}

/** The services add a "#1234" tag to every name; the boards show the name alone (as the game does). */
function displayName(playerName?: string): string {
  if (!playerName) return '?';
  const tag = playerName.lastIndexOf('#');
  return tag > 0 ? playerName.substring(0, tag) : playerName;
}

async function environmentId(env: Env, auth: string): Promise<string> {
  if (env.UGS_ENVIRONMENT_ID) return env.UGS_ENVIRONMENT_ID;
  const r = await fetch(`${API}/unity/v1/projects/${PROJECT_ID}/environments`, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error(`environments ${r.status}`);
  const body = (await r.json()) as { results?: { id: string; name: string }[] };
  const prod = body.results?.find((e) => e.name === 'production');
  if (!prod) throw new Error('no production environment');
  return prod.id;
}

async function readBoard(auth: string, envId: string, board: string): Promise<Row[]> {
  const url = `${API}/leaderboards/v1/projects/${PROJECT_ID}/environments/${envId}/leaderboards/${board}/scores?offset=0&limit=${TOP}&includeMetadata=true`;
  const r = await fetch(url, { headers: { Authorization: auth } });
  // A board without any score yet (or not created yet) is just empty.
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`${board} ${r.status}`);
  const body = (await r.json()) as {
    results?: { playerName?: string; score: number; rank: number; metadata?: string | Record<string, unknown> }[];
  };
  return (body.results ?? []).map((e) => {
    const row: Row = { rank: e.rank + 1, name: displayName(e.playerName), score: Math.round(e.score) };
    let meta: Record<string, unknown> | undefined;
    try {
      meta = typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata;
    } catch {
      meta = undefined;
    }
    if (meta) {
      if (typeof meta.wave === 'number') row.wave = meta.wave;
      if (typeof meta.kills === 'number') row.kills = meta.kills;
      if (typeof meta.names === 'string' && meta.names.includes('|')) row.team = meta.names.split('|').join(', ');
    }
    return row;
  });
}

async function leaderboards(env: Env): Promise<Response> {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${CACHE_SECONDS}` };
  if (!env.UGS_KEY_ID || !env.UGS_SECRET) {
    // Not cached: the boards appear as soon as the secrets are set.
    return new Response(JSON.stringify({ configured: false }), { headers: { ...headers, 'cache-control': 'no-store' } });
  }

  const auth = `Basic ${btoa(`${env.UGS_KEY_ID}:${env.UGS_SECRET}`)}`;
  const envId = await environmentId(env, auth);
  const ids = MODES.flatMap((m) => DIFFICULTIES.flatMap((d) => TEAMS.map((t) => `${m}_${d}_${t}`)));
  const boards: Record<string, Row[]> = {};
  const failed: string[] = [];
  // The API allows 10 requests per second: read five boards at a time.
  for (let i = 0; i < ids.length; i += 5) {
    const chunk = ids.slice(i, i + 5);
    const rows = await Promise.allSettled(chunk.map((id) => readBoard(auth, envId, id)));
    chunk.forEach((id, n) => {
      const r = rows[n];
      if (r.status === 'fulfilled') boards[id] = r.value;
      else failed.push(String(r.reason));
    });
  }
  // One unreadable board leaves that board empty; only when none can be read is the whole answer an error.
  if (failed.length) console.error('boards failed', failed.join(', '));
  if (failed.length === ids.length) throw new Error('no board readable');
  return new Response(JSON.stringify({ configured: true, updated: new Date().toISOString(), boards }), { headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/api/leaderboards') {
      return env.ASSETS.fetch(request);
    }

    // One UGS read per data center every CACHE_SECONDS, however many visitors.
    const cache = (caches as unknown as { default: Cache }).default;
    const key = new Request(`${url.origin}/api/leaderboards?cache=2`);
    const hit = await cache.match(key);
    if (hit) return hit;

    try {
      const response = await leaderboards(env);
      if (response.headers.get('cache-control') !== 'no-store') ctx.waitUntil(cache.put(key, response.clone()));
      return response;
    } catch (error) {
      console.error('leaderboards failed', error);
      return new Response(JSON.stringify({ configured: true, error: true }), {
        status: 502,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      });
    }
  },
};
