-- Green Collector identity: the verifiable credential on profiles.
-- verified_at is world-readable by design (a credential is meant to be seen);
-- everything else about the credential (pickups, rating, tier) is derived
-- client-side from requests.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Defense-in-depth: users update their own profile row (name, GCash/Maya
-- receiving details), so without a guard anyone could self-verify through the
-- API. Only service-role/admin (auth.uid() null) may grant or revoke
-- verification.
create or replace function profiles_guard_update()
returns trigger as $$
begin
  -- Only constrain authenticated end-users; service-role/admin (auth.uid() null) bypasses.
  if auth.uid() is not null then
    if new.verified_at is distinct from old.verified_at then
      raise exception 'verification is granted by Linisa, not self-service';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute procedure profiles_guard_update();
