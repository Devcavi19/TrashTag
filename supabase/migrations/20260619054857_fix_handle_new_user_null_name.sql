
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, default_role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'default_role', 'poster')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
;
