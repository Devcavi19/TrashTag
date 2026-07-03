
-- Profiles: anyone can read, only owner can update
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);

-- Requests: open requests are public; poster and collector can update their own
create policy "requests_select" on requests for select using (true);
create policy "requests_insert" on requests for insert with check (auth.uid() = poster_id);
create policy "requests_update" on requests for update
  using (auth.uid() = poster_id or auth.uid() = collected_by);

-- Likes: authenticated users can like/unlike
create policy "request_likes_select" on request_likes for select using (true);
create policy "request_likes_insert" on request_likes for insert with check (auth.uid() = user_id);
create policy "request_likes_delete" on request_likes for delete using (auth.uid() = user_id);

-- Messages: only poster and assigned collector can read/write
create policy "messages_select" on messages for select
  using (exists (
    select 1 from requests r
    where r.id = messages.request_id
      and (r.poster_id = auth.uid() or r.collected_by = auth.uid())
  ));
create policy "messages_insert" on messages for insert
  with check (auth.uid() = sender_id);

-- Collector locations: collector writes, poster of the active request can read
create policy "collector_locations_select" on collector_locations for select
  using (exists (
    select 1 from requests r
    where r.id = collector_locations.request_id
      and (r.poster_id = auth.uid() or r.collected_by = auth.uid())
  ));
create policy "collector_locations_upsert" on collector_locations for all
  using (auth.uid() = collector_id)
  with check (auth.uid() = collector_id);

-- Posts: public read, authenticated write
create policy "posts_select" on posts for select using (true);
create policy "posts_insert" on posts for insert with check (auth.uid() = author_id);
create policy "posts_update" on posts for update using (auth.uid() = author_id);
create policy "posts_delete" on posts for delete using (auth.uid() = author_id);

-- Post likes: same as request likes
create policy "post_likes_select" on post_likes for select using (true);
create policy "post_likes_insert" on post_likes for insert with check (auth.uid() = user_id);
create policy "post_likes_delete" on post_likes for delete using (auth.uid() = user_id);
;
