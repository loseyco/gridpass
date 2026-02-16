-- Create table for storing raw news articles
CREATE TABLE IF NOT EXISTS os_news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    content TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_included_in_summary BOOLEAN DEFAULT FALSE
);

-- Create table for storing generated summaries and video scripts
CREATE TABLE IF NOT EXISTS os_daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    video_script TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies (optional but good practice, keeping it open for service role mainly)
ALTER TABLE os_news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_daily_summaries ENABLE ROW LEVEL SECURITY;

-- Allow read access to everything for now (adjust as needed for public view)
CREATE POLICY "Allow public read access to news" ON os_news_articles FOR SELECT USING (true);
CREATE POLICY "Allow public read access to summaries" ON os_daily_summaries FOR SELECT USING (true);

-- Allow service role full access (implicit, but good to be explicit if using standard client)
-- (Supabase service role bypasses RLS, so mainly just need public read if we display them)
