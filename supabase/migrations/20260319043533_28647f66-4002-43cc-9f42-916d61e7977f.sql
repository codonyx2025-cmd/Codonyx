ALTER TABLE public.deal_bids ALTER COLUMN bid_status SET DEFAULT 'accepted';
UPDATE public.deal_bids SET bid_status = 'accepted' WHERE bid_status = 'pending';