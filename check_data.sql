-- Add avatar_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_id') THEN
        ALTER TABLE public.users ADD COLUMN avatar_id TEXT DEFAULT 'vegas-gold';
    END IF;
END $$;

-- Check rinks
SELECT count(*), name, city, latitude, longitude, rink_type FROM rinks;
