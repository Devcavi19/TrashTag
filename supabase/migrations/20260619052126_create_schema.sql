
-- Extends Supabase auth.users
create table profiles (
  id uuid references auth.users primary key,
  name text not null,
  default_role text not null check (default_role in ('poster', 'collector')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Core job/request table
create table requests (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid references profiles(id) not null,
  photo_url text,
  location_lat numeric,
  location_lng numeric,
  location_label text,
  location_geohash text,
  tags text[],
  price numeric not null,
  status text not null default 'open'
    check (status in ('open', 'accepted', 'collected', 'paid')),
  after_photo_url text,
  collected_by uuid references profiles(id),
  rating int check (rating between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Normalized likes on requests
create table request_likes (
  request_id uuid references requests(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (request_id, user_id)
);

-- Chat messages scoped to a request
create table messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  sender_id uuid references profiles(id),
  text text not null,
  sent_at timestamptz default now()
);

-- Live collector position (overwritten on each update)
create table collector_locations (
  collector_id uuid references profiles(id) primary key,
  request_id uuid references requests(id),
  lat numeric not null,
  lng numeric not null,
  updated_at timestamptz default now()
);

-- Social feed posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id),
  type text not null check (type in ('event', 'news', 'post')),
  title text,
  body text,
  photo_url text,
  event_date date,
  event_location text,
  external_url text,
  created_at timestamptz default now()
);

-- Normalized likes on posts
create table post_likes (
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);
;
