-- Live player numbers for the home page (worker/live.ts, owner 2026-11-16): the game sends a sign of life every minute
-- and a short report at the end of each round, under a random installation ID that is linked to no account.
-- No IP address, no name, no Unity or Meta ID is stored.

-- One row per installation: when it was first and last seen and what it was doing then (menu or a game mode).
CREATE TABLE IF NOT EXISTS live_players (
  id TEXT PRIMARY KEY,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  mode TEXT NOT NULL DEFAULT 'menu'
);
CREATE INDEX IF NOT EXISTS live_players_last_seen ON live_players (last_seen);

-- One row per closed round of one player (run = the game's random run ID). A co-op round is counted once (role not
-- 'guest'); the zombies count from every player, each player reports the kills credited to them.
CREATE TABLE IF NOT EXISTS live_rounds (
  run TEXT PRIMARY KEY,
  player TEXT NOT NULL,
  mode TEXT NOT NULL,
  role TEXT NOT NULL,
  kills INTEGER NOT NULL,
  wave INTEGER NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS live_rounds_player ON live_rounds (player);

-- Starting values added to the counted numbers (players_base, rounds_base, zombies_base), for the players before
-- the first build that reports; set by hand with wrangler d1 execute.
CREATE TABLE IF NOT EXISTS live_settings (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);
