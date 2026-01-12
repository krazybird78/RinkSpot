-- Add avatar_id to users to persist profile selection
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_id TEXT DEFAULT 'vegas-gold';

-- Fix potential RLS issue for updating own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
