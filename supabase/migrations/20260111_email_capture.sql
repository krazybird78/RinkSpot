-- Subscribers table for email capture
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert (subscribe)
-- We check for uniqueness on the DB level, but the policy just needs to allow the INSERT.
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;
CREATE POLICY "Anyone can subscribe"
  ON public.subscribers FOR INSERT
  WITH CHECK (true);

-- Only service role (admin) can view subscribers
-- Prevents public from reading the email list
DROP POLICY IF EXISTS "Admin can view subscribers" ON public.subscribers;
CREATE POLICY "Admin can view subscribers"
  ON public.subscribers FOR SELECT
  USING (auth.role() = 'service_role');
