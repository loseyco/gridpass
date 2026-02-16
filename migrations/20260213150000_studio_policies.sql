-- Allow App Management for Studio
-- Ideally restricts to admins, but for dev velocity allowing authenticated.
create policy "Authenticated can manage apps"
  on public.os_apps for all
  using ( auth.role() = 'authenticated' )
  with check ( auth.role() = 'authenticated' );

-- Notify reload
NOTIFY pgrst, 'reload schema';
