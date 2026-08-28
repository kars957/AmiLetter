CREATE TABLE IF NOT EXISTS interactions_next (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('opened', 'page_progress', 'acknowledged')),
  page INTEGER NULL CHECK (page IS NULL OR page BETWEEN 1 AND 5),
  created_at TEXT NOT NULL,
  clicked_at_utc TEXT NOT NULL,
  clicked_at_sydney TEXT NOT NULL
);

INSERT INTO interactions_next (id, type, page, created_at, clicked_at_utc, clicked_at_sydney)
SELECT
  id,
  type,
  NULL,
  COALESCE(clicked_at_utc, strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  COALESCE(clicked_at_utc, strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  COALESCE(clicked_at_sydney, '')
FROM interactions;

DROP TABLE interactions;

ALTER TABLE interactions_next RENAME TO interactions;

CREATE INDEX IF NOT EXISTS interactions_type_idx ON interactions (type);
CREATE INDEX IF NOT EXISTS interactions_page_idx ON interactions (page);
CREATE INDEX IF NOT EXISTS interactions_created_at_idx ON interactions (created_at);
