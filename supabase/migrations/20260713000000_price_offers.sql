CREATE TABLE price_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  collector_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE price_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collectors can insert own pending offers"
  ON price_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = collector_id
    AND status = 'pending'
    AND EXISTS (SELECT 1 FROM requests WHERE id = request_id AND status = 'open')
  );

CREATE POLICY "Participants can view offers"
  ON price_offers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = collector_id
    OR auth.uid() IN (SELECT poster_id FROM requests WHERE id = request_id)
  );

CREATE POLICY "Posters can update offer status"
  ON price_offers
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT poster_id FROM requests WHERE id = request_id)
  )
  WITH CHECK (
    auth.uid() IN (SELECT poster_id FROM requests WHERE id = request_id)
  );

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE price_offers;

-- accept_price_offer(offer_id) function
CREATE OR REPLACE FUNCTION accept_price_offer(offer_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
  v_collector_id UUID;
  v_price NUMERIC;
  v_poster_id UUID;
  v_status TEXT;
BEGIN
  -- Get offer details
  SELECT request_id, collector_id, price INTO v_request_id, v_collector_id, v_price
  FROM price_offers
  WHERE id = offer_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found or not pending';
  END IF;

  -- Get request details
  SELECT poster_id, status INTO v_poster_id, v_status
  FROM requests
  WHERE id = v_request_id;

  IF auth.uid() != v_poster_id THEN
    RAISE EXCEPTION 'Only the poster can accept an offer';
  END IF;

  IF v_status != 'open' THEN
    RAISE EXCEPTION 'Request is no longer open';
  END IF;

  -- Update request
  UPDATE requests
  SET price = v_price,
      status = 'accepted',
      collected_by = v_collector_id
  WHERE id = v_request_id AND status = 'open';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Concurrency issue: request was modified';
  END IF;

  -- Update the accepted offer
  UPDATE price_offers
  SET status = 'accepted'
  WHERE id = offer_id;

  -- Decline sibling offers
  UPDATE price_offers
  SET status = 'declined'
  WHERE request_id = v_request_id AND id != offer_id AND status = 'pending';

END;
$$;
