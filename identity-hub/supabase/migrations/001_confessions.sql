-- Run this in your Supabase SQL editor
-- Dashboard → SQL Editor → New query → paste → Run

CREATE TABLE IF NOT EXISTS confessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content      TEXT        NOT NULL CHECK (char_length(content) BETWEEN 10 AND 500),
  category     TEXT        NOT NULL DEFAULT 'confession'
                           CHECK (category IN ('confession', 'question', 'unpopular_opinion')),
  reactions    JSONB       NOT NULL DEFAULT '{"❤️":0,"😂":0,"😮":0,"🔥":0,"💀":0}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_confessions_created ON confessions (created_at DESC);

ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "confessions_read"   ON confessions FOR SELECT USING (true);
CREATE POLICY "confessions_insert" ON confessions FOR INSERT WITH CHECK (
  char_length(content) BETWEEN 10 AND 500
);

-- Atomic reaction increment (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_reaction(confession_id UUID, emoji_key TEXT)
RETURNS void LANGUAGE sql AS $$
  UPDATE confessions
  SET reactions = jsonb_set(
    reactions,
    ARRAY[emoji_key],
    to_jsonb(COALESCE((reactions->>emoji_key)::int, 0) + 1)
  )
  WHERE id = confession_id;
$$;

-- Enable Realtime for live feed updates:
-- Dashboard → Database → Replication → toggle "confessions" table ON
