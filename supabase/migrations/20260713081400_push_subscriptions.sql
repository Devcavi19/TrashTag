create table push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    endpoint text unique not null,
    p256dh text not null,
    auth text not null,
    created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "Users can manage their own push subscriptions"
    on push_subscriptions
    for all
    using (auth.uid() = user_id);
