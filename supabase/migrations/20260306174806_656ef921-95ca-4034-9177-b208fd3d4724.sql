
CREATE OR REPLACE FUNCTION public.get_deal_aggregate_stats()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'unique_bidders', (SELECT COUNT(DISTINCT distributor_profile_id) FROM deal_bids),
    'total_subscription', (SELECT COALESCE(SUM(bid_amount), 0) FROM deal_bids),
    'total_target', (SELECT COALESCE(SUM(target_amount), 0) FROM deals)
  ) INTO result;
  RETURN result;
END;
$$;
