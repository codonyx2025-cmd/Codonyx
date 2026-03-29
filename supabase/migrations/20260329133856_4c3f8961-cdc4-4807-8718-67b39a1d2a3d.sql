
-- Fix 1: Add deny-all RLS policies on password_reset_otps and registration_otps
-- These tables should only be accessed via service-role in edge functions

CREATE POLICY "Deny all direct access to password reset OTPs"
ON public.password_reset_otps
FOR ALL
TO public, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all direct access to registration OTPs"
ON public.registration_otps
FOR ALL
TO public, authenticated
USING (false)
WITH CHECK (false);

-- Fix 2: Replace the overly permissive profiles INSERT policy
DROP POLICY IF EXISTS "Anyone can insert profile during registration" ON public.profiles;

CREATE POLICY "Authenticated users can insert own profile during registration"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND approval_status = 'pending'
);
