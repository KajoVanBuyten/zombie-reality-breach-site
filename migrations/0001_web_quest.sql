-- Web AR quest "Breach in deinem Zuhause" (Docs/WEB_AR_QUEST.md in the game repo). D1 database "zrb-web-quest".
-- All times are milliseconds since 1970 (UTC).
-- Apply: npx wrangler d1 migrations apply zrb-web-quest --remote

-- One row per quest run. ip_hash is an HMAC of the IP with a daily changing salt, only for the start limit.
-- Rows older than 7 days are deleted by the worker.
CREATE TABLE IF NOT EXISTS quest_runs (
  run TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  step INTEGER NOT NULL DEFAULT 0,
  step_at INTEGER,
  finished_at INTEGER
);
CREATE INDEX IF NOT EXISTS quest_runs_ip_started ON quest_runs (ip_hash, started_at);
CREATE INDEX IF NOT EXISTS quest_runs_started ON quest_runs (started_at);

-- One reward per Meta account (org-scoped id), written after a verified account link.
CREATE TABLE IF NOT EXISTS rewards (
  org_scoped_id TEXT PRIMARY KEY,
  item TEXT NOT NULL,
  earned_at INTEGER NOT NULL,
  claimed_at INTEGER
);

-- One redemption code per finished run; redeemed_by is the Unity player id of the first player who redeemed it.
CREATE TABLE IF NOT EXISTS codes (
  code TEXT PRIMARY KEY,
  item TEXT NOT NULL,
  run TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  redeemed_by TEXT,
  redeemed_at INTEGER
);
CREATE INDEX IF NOT EXISTS codes_redeemed_by ON codes (redeemed_by);
