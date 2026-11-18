CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  session TEXT NOT NULL,
  at INTEGER NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  value INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL,
  source TEXT NOT NULL,
  medium TEXT NOT NULL,
  campaign TEXT NOT NULL,
  content TEXT NOT NULL,
  device TEXT NOT NULL,
  browser TEXT NOT NULL,
  country TEXT NOT NULL,
  consent_version TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS analytics_at ON analytics_events(at);
CREATE INDEX IF NOT EXISTS analytics_session_at ON analytics_events(session, at);
CREATE INDEX IF NOT EXISTS analytics_event_at ON analytics_events(name, at);
CREATE TABLE IF NOT EXISTS analytics_budget (day TEXT PRIMARY KEY, events INTEGER NOT NULL);
CREATE TRIGGER IF NOT EXISTS analytics_daily_limit BEFORE INSERT ON analytics_events
WHEN COALESCE((SELECT events FROM analytics_budget WHERE day = date(NEW.at/1000,'unixepoch')),0) >= 10000
BEGIN SELECT RAISE(IGNORE); END;
CREATE TRIGGER IF NOT EXISTS analytics_daily_count AFTER INSERT ON analytics_events
BEGIN
 INSERT INTO analytics_budget(day,events) VALUES(date(NEW.at/1000,'unixepoch'),1)
 ON CONFLICT(day) DO UPDATE SET events = events + 1;
END;
