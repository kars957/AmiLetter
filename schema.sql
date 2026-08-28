CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('opened', 'page_progress', 'acknowledged')),
  page INTEGER NULL CHECK (page IS NULL OR page BETWEEN 1 AND 5),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS interactions_type_idx ON interactions (type);
CREATE INDEX IF NOT EXISTS interactions_page_idx ON interactions (page);
CREATE INDEX IF NOT EXISTS interactions_created_at_idx ON interactions (created_at);
