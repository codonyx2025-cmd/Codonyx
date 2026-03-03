
-- Add admin role for info@codonyx.org
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::app_role
FROM public.profiles p
WHERE lower(p.email) = 'info@codonyx.org'
ON CONFLICT (user_id, role) DO NOTHING;
