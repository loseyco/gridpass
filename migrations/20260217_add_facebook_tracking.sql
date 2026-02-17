-- Add Facebook tracking columns to News Articles
ALTER TABLE IF EXISTS os_news_articles 
ADD COLUMN IF NOT EXISTS facebook_post_id TEXT,
ADD COLUMN IF NOT EXISTS is_published_to_facebook BOOLEAN DEFAULT FALSE;

-- Add Facebook tracking columns to User Profiles (for new member announcements)
-- Using os_user_profiles as the active OS table
ALTER TABLE IF EXISTS os_user_profiles 
ADD COLUMN IF NOT EXISTS facebook_announcement_post_id TEXT,
ADD COLUMN IF NOT EXISTS announced_to_facebook_at TIMESTAMPTZ;
