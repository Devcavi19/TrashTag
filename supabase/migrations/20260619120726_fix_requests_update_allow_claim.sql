-- Allow a collector to claim an unclaimed (open) request, while keeping poster
-- control and blocking hijacking of already-accepted requests.
drop policy if exists requests_update on public.requests;

create policy requests_update on public.requests
  for update
  using (
    auth.uid() = poster_id
    or auth.uid() = collected_by
    or (status = 'open' and collected_by is null)
  )
  with check (
    auth.uid() = poster_id
    or auth.uid() = collected_by
  );;
