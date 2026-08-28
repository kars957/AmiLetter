CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('opened', 'acknowledged')),
  clicked_at_utc TEXT NOT NULL,
  clicked_at_sydney TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS interactions_type_idx ON interactions (type);
CREATE INDEX IF NOT EXISTS interactions_clicked_at_utc_idx ON interactions (clicked_at_utc);
