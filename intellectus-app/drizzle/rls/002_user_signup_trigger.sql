-- Creates the matching public.users row the instant someone signs up via
-- Supabase Auth. Done as a database trigger (not app-level) so it's atomic
-- and can't be skipped by any entry point — including future OAuth
-- providers, which never touch our Next.js code at all during the
-- initial handshake.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name, display_name_set, role)
  values (
    new.id,
    coalesce(split_part(new.email, '@', 1), 'reader'),
    false,
    'reader'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();
