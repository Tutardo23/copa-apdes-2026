CREATE TABLE IF NOT EXISTS copa_photos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url TEXT NOT NULL,
  pathname TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  uploaded_by TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS copa_photos_status_created_idx
ON copa_photos (status, created_at DESC);
