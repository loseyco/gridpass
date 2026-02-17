
-- Insert High-Quality RSS Feeds
INSERT INTO public.os_news_sources (name, url, type, category, enabled, reliability_score)
VALUES 
    ('Racer.com', 'https://racer.com/feed/', 'rss', 'Racing', true, 95),
    ('Motorsport.com', 'https://www.motorsport.com/rss/all/news/', 'rss', 'Global', true, 90),
    ('IndyCar', 'https://www.indycar.com/rss/news', 'rss', 'IndyCar', true, 100),
    ('IMSA', 'https://www.imsa.com/feed/', 'rss', 'IMSA', true, 100),
    ('Jalopnik', 'https://jalopnik.com/rss', 'rss', 'Culture', true, 80)
ON CONFLICT (name) DO UPDATE 
SET enabled = true, url = EXCLUDED.url;
