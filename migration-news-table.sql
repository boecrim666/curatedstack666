CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_sk TEXT,
  description TEXT,
  url TEXT NOT NULL,
  source_name TEXT,
  category TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);

-- Migration for existing DBs (run once in Supabase SQL editor):
-- ALTER TABLE news ADD COLUMN IF NOT EXISTS title_sk TEXT;
