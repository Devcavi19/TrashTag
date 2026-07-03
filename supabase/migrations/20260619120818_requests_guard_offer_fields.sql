-- Defense-in-depth: only the poster may change offer/content fields, and a
-- non-poster may only claim an unclaimed request as themselves.
create or replace function requests_guard_update()
returns trigger as $$
begin
  if auth.uid() is distinct from old.poster_id then
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
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists requests_guard on public.requests;
create trigger requests_guard
  before update on public.requests
  for each row execute procedure requests_guard_update();;
