-- 1. Add the 'disputed' status to the requests lifecycle (payment reject path)
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE public.requests
  ADD CONSTRAINT requests_status_check
  CHECK (status = ANY (ARRAY['open'::text, 'accepted'::text, 'collected'::text, 'disputed'::text, 'paid'::text]));

-- 2. Two-sided ratings: keep requests.rating (poster -> collector); add collector_rating (collector -> poster)
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS collector_rating integer;
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_collector_rating_check;
ALTER TABLE public.requests
  ADD CONSTRAINT requests_collector_rating_check
  CHECK (collector_rating IS NULL OR (collector_rating >= 1 AND collector_rating <= 5));

-- 3. Deprecate roles: default_role no longer required or constrained
ALTER TABLE public.profiles ALTER COLUMN default_role DROP NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_default_role_check;;
