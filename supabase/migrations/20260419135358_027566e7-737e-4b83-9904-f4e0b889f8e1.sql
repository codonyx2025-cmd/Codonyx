CREATE OR REPLACE FUNCTION public.get_deal_aggregate_stats()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  usd_to_inr numeric := 83.5;
BEGIN
  SELECT json_build_object(
    'unique_bidders', (SELECT COUNT(DISTINCT distributor_profile_id) FROM deal_bids),
    'approved_distributors', (SELECT COUNT(*) FROM profiles WHERE user_type = 'distributor' AND approval_status = 'approved'),
    'total_subscription', (
      SELECT COALESCE(SUM(
        CASE
          WHEN COALESCE(d.currency, 'INR') = 'USD' THEN db.bid_amount * usd_to_inr
          ELSE db.bid_amount
        END
      ), 0)
      FROM deal_bids db
      LEFT JOIN deals d ON d.id = db.deal_id
    ),
    'total_target', (
      SELECT COALESCE(SUM(
        CASE
          WHEN COALESCE(currency, 'INR') = 'USD' THEN target_amount * usd_to_inr
          ELSE target_amount
        END
      ), 0)
      FROM deals
    )
  ) INTO result;
  RETURN result;
END;
$$;