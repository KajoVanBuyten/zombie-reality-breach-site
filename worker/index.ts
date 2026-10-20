// Worker in front of the static site. Everything outside /api/* is the built site (dist/); the API routes are:
//   /api/leaderboards          top scores from Unity Gaming Services (leaderboards.ts)
//   /api/quest/*               web AR quest runs and redemption codes (quest.ts)
//   /api/meta/*                Meta account linking for the quest reward (meta.ts)
//   /api/rewards/*             server-to-server reward lookup for the game's Cloud Code (rewards.ts)
// Contract: Docs/WEB_AR_QUEST.md in the game repo.

import type { Ctx, Env } from './env';
import { HttpError, fail } from './http';
import { handleLeaderboards } from './leaderboards';
import { handleQuest } from './quest';
import { handleMeta } from './meta';
import { handleRewards } from './rewards';

async function route(path: string, request: Request, env: Env, ctx: Ctx): Promise<Response> {
  if (path.startsWith('/api/quest/')) return handleQuest(path, request, env, ctx);
  if (path.startsWith('/api/meta/')) return handleMeta(path, request, env);
  if (path.startsWith('/api/rewards/')) return handleRewards(path, request, env);
  throw new HttpError(404, 'not_found');
}

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === '/api/leaderboards') return handleLeaderboards(request, env, ctx);
    if (!path.startsWith('/api/')) return env.ASSETS.fetch(request);

    try {
      return await route(path, request, env, ctx);
    } catch (error) {
      if (error instanceof HttpError) return fail(error.status, error.code);
      // Only the error name goes to the log: messages could contain request data.
      console.error('api failed', path, error instanceof Error ? error.name : 'unknown');
      return fail(500, 'server_error');
    }
  },
};
