-- Phase 2: dual-confirmation payment handshake.
-- Money moves outside the app (GCash/Maya/cash); the app records the
-- handshake: poster marks payment sent, collector confirms receipt.

-- 1. New lifecycle step between 'collected' and 'paid'
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE public.requests
  ADD CONSTRAINT requests_status_check
  CHECK (status = ANY (ARRAY['open'::text, 'accepted'::text, 'collected'::text, 'disputed'::text, 'payment_sent'::text, 'paid'::text]));

-- 2. Payment handshake fields
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;

ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_payment_method_check;
ALTER TABLE public.requests
  ADD CONSTRAINT requests_payment_method_check
  CHECK (payment_method IS NULL OR payment_method = ANY (ARRAY['gcash'::text, 'maya'::text, 'cash'::text]));

-- 3. Collector receiving details (world-readable via existing profiles_select)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gcash_number text,
  ADD COLUMN IF NOT EXISTS maya_number text;

-- 4. Extend the defense-in-depth guard: the poster owns the "sent" side of the
-- handshake (a non-poster may only CLEAR those fields — the "haven't received
-- it?" escape hatch), and only the collector may confirm receipt.
create or replace function requests_guard_update()
returns trigger as $$
begin
  -- Only constrain authenticated end-users; service-role/admin (auth.uid() null) bypasses.
  if auth.uid() is not null and auth.uid() is distinct from old.poster_id then
    if new.price        is distinct from old.price
       or new.tags           is distinct from old.tags
       or new.photo_url      is distinct from old.photo_url
       or new.location_label is distinct from old.location_label
       or new.location_lat   is distinct from old.location_lat
       or new.location_lng   is distinct from old.location_lng
       or new.poster_id      is distinct from old.poster_id then
      raise exception 'only the poster may modify request offer fields';
    end if;
    if new.collected_by is distinct from old.collected_by then
      if old.collected_by is not null or new.collected_by is distinct from auth.uid() then
        raise exception 'cannot reassign an already-claimed request';
      end if;
    end if;
    -- non-poster may only clear payment-sent fields, never set them
    if (new.payment_method is distinct from old.payment_method and new.payment_method is not null)
       or (new.payment_reference is distinct from old.payment_reference and new.payment_reference is not null)
       or (new.payment_sent_at is distinct from old.payment_sent_at and new.payment_sent_at is not null) then
      raise exception 'only the poster may report a payment as sent';
    end if;
  end if;
  if auth.uid() is not null and auth.uid() is distinct from old.collected_by then
    -- only the collector may confirm (or un-confirm) receipt
    if new.payment_confirmed_at is distinct from old.payment_confirmed_at then
      raise exception 'only the collector may confirm payment receipt';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;
