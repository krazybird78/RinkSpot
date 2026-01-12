-- RinkSpot Database Schema
-- Create tables for users, rinks, reports, and leaderboards

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  neighborhood_team TEXT,
  has_heritage_pack BOOLEAN DEFAULT FALSE,
  has_enforcer_pack BOOLEAN DEFAULT FALSE,
  has_nostalgia_pack BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rinks table
CREATE TABLE IF NOT EXISTS public.rinks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  rink_type TEXT NOT NULL CHECK (rink_type IN ('outdoor', 'indoor', 'pond')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table (crowd and ice status updates)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rink_id UUID NOT NULL REFERENCES public.rinks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  crowd_level TEXT NOT NULL CHECK (crowd_level IN ('empty', 'light', 'medium', 'packed')),
  ice_status TEXT NOT NULL CHECK (ice_status IN ('frozen', 'good', 'slush', 'melted')),
  temperature DECIMAL(5, 2),
  user_override BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboards table (neighborhood team rankings)
CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  neighborhood_team TEXT NOT NULL,
  total_reports INTEGER DEFAULT 0,
  week_start DATE NOT NULL,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(neighborhood_team, week_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rinks_location ON public.rinks(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_rinks_city ON public.rinks(city);
CREATE INDEX IF NOT EXISTS idx_rinks_country ON public.rinks(country);
CREATE INDEX IF NOT EXISTS idx_reports_rink_id ON public.reports(rink_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboards_week ON public.leaderboards(week_start DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

-- Users: Users can read all, update only their own
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
CREATE POLICY "Users can view all users"
  ON public.users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Rinks: Anyone can read, authenticated users can create
DROP POLICY IF EXISTS "Anyone can view rinks" ON public.rinks;
CREATE POLICY "Anyone can view rinks"
  ON public.rinks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create rinks" ON public.rinks;
CREATE POLICY "Authenticated users can create rinks"
  ON public.rinks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own rinks" ON public.rinks;
CREATE POLICY "Users can update own rinks"
  ON public.rinks FOR UPDATE
  USING (auth.uid() = created_by);

-- Reports: Anyone can read, authenticated users can create
DROP POLICY IF EXISTS "Anyone can view reports" ON public.reports;
CREATE POLICY "Anyone can view reports"
  ON public.reports FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.reports;
CREATE POLICY "Authenticated users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Leaderboards: Anyone can read, system can write
DROP POLICY IF EXISTS "Anyone can view leaderboards" ON public.leaderboards;
CREATE POLICY "Anyone can view leaderboards"
  ON public.leaderboards FOR SELECT
  USING (true);

-- Functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rinks_updated_at ON public.rinks;
CREATE TRIGGER update_rinks_updated_at
  BEFORE UPDATE ON public.rinks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leaderboards_updated_at ON public.leaderboards;
CREATE TRIGGER update_leaderboards_updated_at
  BEFORE UPDATE ON public.leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
