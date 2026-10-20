// Bindings and settings of the site worker (wrangler.jsonc), plus the few D1 types the worker uses. The repo has no
// @cloudflare/workers-types, so the D1 surface is declared here as far as it is called.

export interface D1Result<T = unknown> {
  results?: T[];
  meta: { changes: number };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  // Leaderboards (worker/leaderboards.ts).
  UGS_KEY_ID?: string;
  UGS_SECRET?: string;
  UGS_ENVIRONMENT_ID?: string;
  // Web AR quest (Docs/WEB_AR_QUEST.md in the game repo). D1 database "zrb-web-quest".
  DB?: D1Database;
  /** Public Meta app ID (var). */
  META_APP_ID?: string;
  /** Meta team (organization) ID for account linking (var, not a secret). Empty until the owner sets it. */
  META_ORG_ID?: string;
  /** Secrets, set by the owner with `wrangler secret put`. Never logged, never returned. */
  META_APP_SECRET?: string;
  QUEST_SECRET?: string;
  WEB_REWARDS_KEY?: string;
}

export interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
}
