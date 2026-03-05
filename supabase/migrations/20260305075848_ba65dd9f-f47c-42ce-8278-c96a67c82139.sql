CREATE OR REPLACE FUNCTION public.check_email_exists(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE lower(email) = lower(check_email)
      AND approval_status = 'approved'
  );
END;
$function$;