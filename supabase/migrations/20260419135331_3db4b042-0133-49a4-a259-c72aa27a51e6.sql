CREATE OR REPLACE FUNCTION public.get_admin_profile_ids()
RETURNS TABLE(profile_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role = 'admin';
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_profile_ids() TO authenticated;