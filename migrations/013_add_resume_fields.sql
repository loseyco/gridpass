-- Add new fields to resume_leads table
alter table public.resume_leads
add column if not exists resume_url text,
add column if not exists photo_url text,
add column if not exists indeed_url text,
add column if not exists social_links jsonb default '{}'::jsonb;

-- Create 'resumes' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

-- Storage Policies for 'resumes' bucket

-- 1. Allow public read access (so Admin can see them, and potentially user profile if public)
drop policy if exists "Public can view resumes bucket" on storage.objects;
create policy "Public can view resumes bucket"
on storage.objects for select
to public
using (bucket_id = 'resumes');

-- 2. Allow authenticated users to upload (Intake form might be public, so we might need 'anon' too if we want truly public uploads, but service role in server action handles this safely without this policy if we use service role key. 
-- However, if we used client-side upload, we'd need this. 
-- Since we are doing server-side upload via Server Action with Service Role, we strictly DON'T need an insert policy for anon/authenticated if the action uses service role.
-- BUT, if the action uses the user's session, we need a policy.
-- The plan is to use Service Role in the Server Action to bypass RLS for storage, ensuring only our code can upload.)

-- So, no Insert policy needed for 'anon' if we use Service Role in the Server Action.
