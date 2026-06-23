-- CaseCraft application tables on Cloudflare D1 (SQLite).
-- Better Auth manages its own tables (user, session, account, verification)
-- via its CLI-generated migration; these are the app-domain tables.

CREATE TABLE IF NOT EXISTS designs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled design',
  phone_model TEXT,
  platform TEXT,
  design_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_designs_user ON designs (user_id);
CREATE INDEX IF NOT EXISTS idx_designs_updated ON designs (updated_at);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  design_id TEXT,
  phone_model TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  price_cents INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
