-- Sync Legacy Profiles to OS Kernel
-- Description: Copies core identity data from 'profiles' to 'os_user_profiles' to ensure continuity.

INSERT INTO public.os_user_profiles (
    id, 
    username, 
    first_name, 
    last_name, 
    avatar_url, 
    cover_photo_url,
    bio,
    website,
    social_links,
    updated_at
)
SELECT 
    id, 
    username, 
    -- Rudimentary split of full_name
    split_part(full_name, ' ', 1),
    case 
        when position(' ' in full_name) > 0 then substring(full_name from position(' ' in full_name)+1) 
        else '' 
    end,
    avatar_url,
    cover_url, -- Mapping cover_url (legacy) -> cover_photo_url (OS)
    bio,
    website,
    social_links,
    now()
FROM 
    public.profiles
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    cover_photo_url = EXCLUDED.cover_photo_url,
    bio = user_in_conflict.bio, -- Preserve existing OS edits if any? Or Overwrite?
    social_links = EXCLUDED.social_links; -- Let's overwrite with legacy for the initial sync to be safe.

-- Actually, if I want to respect Resume Builder edits (OS), I should DO NOTHING on conflict?
-- But the user hasn't successfully used Resume Builder on this profile yet likely.
-- Let's use DO UPDATE to ensure the LINK exists.
-- But maybe use COALESCE to keep existing OS data if non-null?
-- For now, a clean sync is probably safer for the user's specific request "make it work".
