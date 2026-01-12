-- Collaborative Rink Deletion Schema

-- Create deletion_requests table
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rink_id UUID NOT NULL REFERENCES public.rinks(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.users(id),
  confirmed_by UUID REFERENCES public.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_deletion_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent duplicate requests for the same rink while one is pending
  UNIQUE(rink_id, status)
);

-- RLS Policies
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- Everyone can view requests (needed for UI to show status)
CREATE POLICY "Anyone can view deletion requests"
  ON public.deletion_requests FOR SELECT
  USING (true);

-- Authenticated users can create requests
CREATE POLICY "Authenticated users can create deletion requests"
  ON public.deletion_requests FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update (confirm) requests
-- Constraint: Cannot confirm your own request is handled in app logic, but RLS can enforce it too generally
CREATE POLICY "Authenticated users can update deletion requests"
  ON public.deletion_requests FOR UPDATE
  USING (auth.role() = 'authenticated');
