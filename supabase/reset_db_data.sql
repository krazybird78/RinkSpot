-- ⚠️ DANGER: This script wipes all user-generated content!
-- Run this in the Supabase SQL Editor to clear test data before going live.

-- 1. Clear Reports (Ice Conditions/Activity)
TRUNCATE TABLE public.reports CASCADE;

-- 2. Clear Rinks (Locations)
-- Uncomment the next line if you want to delete all rinks too:
-- TRUNCATE TABLE public.rinks CASCADE;

-- 3. Clear Leaderboards
TRUNCATE TABLE public.leaderboards CASCADE;

-- 4. Reset User Stats (Optional - if you want to zero out points)
TRUNCATE TABLE public.user_stats CASCADE;
TRUNCATE TABLE public.user_badges CASCADE;

-- 5. Clear Subscribers (Optional)
-- TRUNCATE TABLE public.subscribers CASCADE;

-- Note: This does NOT delete User Accounts (auth.users).
-- Users will still exist but will have no data associated with them.
