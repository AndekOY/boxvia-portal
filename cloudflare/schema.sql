CREATE TABLE IF NOT EXISTS claims (
 id TEXT PRIMARY KEY,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 email TEXT NOT NULL,
 exact_claim TEXT NOT NULL,
 primary_source_url TEXT NOT NULL,
 source_version_or_date TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'submitted',
 notification_sent INTEGER NOT NULL DEFAULT 0
);
