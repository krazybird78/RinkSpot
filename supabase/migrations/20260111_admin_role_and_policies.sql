-- Add Admin Role and Delete Permissions

-- 1. Add is_admin column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Allow Admins to Delete Rinks
DROP POLICY IF EXISTS "Admins can delete rinks" ON public.rinks;
CREATE POLICY "Admins can delete rinks"
  ON public.rinks FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = TRUE)
  );

-- 3. Allow Admins to Delete Reports
DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;
CREATE POLICY "Admins can delete reports"
  ON public.reports FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = TRUE)
  );

-- 4. Allow Admins to Update Rinks (Edit details) without being the creator
DROP POLICY IF EXISTS "Admins can update rinks" ON public.rinks;
CREATE POLICY "Admins can update rinks"
  ON public.rinks FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = TRUE)
    OR
    created_by = auth.uid()
  );
