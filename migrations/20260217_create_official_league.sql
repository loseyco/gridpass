-- gridpass Official League Schema (OS Module)

-- ==========================================
-- LEAGUES & SEASONS
-- ==========================================

CREATE TABLE IF NOT EXISTS os_leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  
  -- Configuration
  is_official BOOLEAN DEFAULT false, -- The "GridPass Official" leagues
  is_public BOOLEAN DEFAULT true,
  require_membership BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE os_leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read leagues" ON os_leagues FOR SELECT USING (true);
CREATE POLICY "Owners can update leagues" ON os_leagues FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert leagues" ON os_leagues FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS os_league_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES os_leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Season 1 2026"
  slug TEXT NOT NULL,
  
  start_date DATE,
  end_date DATE,
  
  -- Money
  entry_fee_amount DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}', -- Rules, points system config
  
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(league_id, slug)
);

ALTER TABLE os_league_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read seasons" ON os_league_seasons FOR SELECT USING (true);
CREATE POLICY "Owners can manage seasons" ON os_league_seasons FOR ALL USING (
  EXISTS (SELECT 1 FROM os_leagues WHERE id = os_league_seasons.league_id AND owner_id = auth.uid())
);

-- ==========================================
-- EVENTS & SCHEDULING
-- ==========================================

CREATE TABLE IF NOT EXISTS os_league_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES os_league_seasons(id) ON DELETE CASCADE,
  league_id UUID REFERENCES os_leagues(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- "Round 1: Daytona"
  description TEXT,
  
  -- Track Info (Using the OS Sim Racing tables if available, or just text for now)
  track_name TEXT NOT NULL,
  config_name TEXT,
  
  start_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled', -- scheduled, active, completed, cancelled
  
  -- iRacing Specifics
  subsession_id INTEGER, -- Link to actual iRacing result
  session_password TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE os_league_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read events" ON os_league_events FOR SELECT USING (true);
CREATE POLICY "Owners can manage events" ON os_league_events FOR ALL USING (
  EXISTS (SELECT 1 FROM os_leagues WHERE id = os_league_events.league_id AND owner_id = auth.uid())
);

-- ==========================================
-- MEMBERSHIP & DRIVERS
-- ==========================================

CREATE TABLE IF NOT EXISTS os_league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES os_leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  role TEXT DEFAULT 'driver', -- driver, admin, steward, broadcaster
  status TEXT DEFAULT 'active', -- active, suspended, pending
  
  -- Driver Info
  car_number TEXT,
  iracing_customer_id INTEGER,
  safety_rating DECIMAL,
  irating INTEGER,
  
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(league_id, user_id)
);

ALTER TABLE os_league_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read members" ON os_league_members FOR SELECT USING (true);
CREATE POLICY "Users can join" ON os_league_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can manage members" ON os_league_members FOR ALL USING (
  EXISTS (SELECT 1 FROM os_leagues WHERE id = os_league_members.league_id AND owner_id = auth.uid())
);

-- ==========================================
-- RESULTS & SCORING
-- ==========================================

CREATE TABLE IF NOT EXISTS os_league_race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES os_league_events(id) ON DELETE CASCADE,
  driver_member_id UUID REFERENCES os_league_members(id),
  
  position INTEGER NOT NULL,
  qualifying_position INTEGER,
  
  -- Performance
  laps_completed INTEGER,
  best_lap_time INTEGER, -- ms
  average_lap_time INTEGER, -- ms
  incidents INTEGER DEFAULT 0,
  
  -- Scoring
  points_earned DECIMAL DEFAULT 0,
  
  status TEXT DEFAULT 'official', -- official, disqualified
  
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE os_league_race_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read results" ON os_league_race_results FOR SELECT USING (true);
-- Only system/admins should insert results usually

-- ==========================================
-- ECOSYSTEM (MONETIZED CONTENT)
-- ==========================================

CREATE TABLE IF NOT EXISTS os_league_ecosystem_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES os_league_seasons(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'setup', 'paint', 'replay'
  
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  
  -- Applicability
  car_name TEXT,
  track_name TEXT,
  
  is_premium BOOLEAN DEFAULT true, -- Requires paid league entry
  downloads INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE os_league_ecosystem_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read items" ON os_league_ecosystem_items FOR SELECT USING (true);
