-- ============================================
-- SWTCG LEAGUE - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Seasons
CREATE TABLE seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  year INT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Players
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly Tournaments
CREATE TABLE tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tournament Results (one row per player per tournament)
-- position: 1 = Champion, 2 = Runner-up, 3 = Top3, 4 = Top4, 0 = Attended only
CREATE TABLE tournament_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  position INT NOT NULL, -- 1,2,3,4 or 0 for attendance only
  points_earned INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, player_id)
);

-- Hall of Fame
CREATE TABLE hall_of_fame (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(season_id)
);

-- Admin users (handled by Supabase Auth, this is just for reference)
-- Use Supabase Dashboard > Authentication > Users to create admin account

-- ============================================
-- VIEWS - Leaderboard per season
-- ============================================
CREATE OR REPLACE VIEW season_leaderboard AS
SELECT
  s.id AS season_id,
  s.name AS season_name,
  p.id AS player_id,
  p.name AS player_name,
  COUNT(tr.id) AS tournaments_played,
  SUM(tr.points_earned) AS total_points,
  COUNT(CASE WHEN tr.position = 1 THEN 1 END) AS wins,
  RANK() OVER (PARTITION BY s.id ORDER BY SUM(tr.points_earned) DESC) AS position
FROM seasons s
JOIN tournament_results tr ON tr.tournament_id IN (
  SELECT id FROM tournaments WHERE season_id = s.id
)
JOIN players p ON p.id = tr.player_id
GROUP BY s.id, s.name, p.id, p.name;

-- ============================================
-- STORAGE - For Hall of Fame photos
-- ============================================
-- Run this in Supabase Dashboard > Storage > Create bucket named "hall-of-fame"
-- Then set it to public

-- ============================================
-- RLS Policies
-- ============================================

-- Public can read everything
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_of_fame ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read results" ON tournament_results FOR SELECT USING (true);
CREATE POLICY "Public read hall_of_fame" ON hall_of_fame FOR SELECT USING (true);

-- Only authenticated (admin) can write
CREATE POLICY "Auth write seasons" ON seasons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write players" ON players FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write tournaments" ON tournaments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write results" ON tournament_results FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write hall_of_fame" ON hall_of_fame FOR ALL USING (auth.role() = 'authenticated');
