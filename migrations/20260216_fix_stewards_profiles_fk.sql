alter table public.os_stewards_comments
  add constraint os_stewards_comments_profiles_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;
