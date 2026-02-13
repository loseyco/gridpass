import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditHub from './ProfileEditHub'

export default async function ProfileEditPage() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?next=/profile/edit')
    }

    // Fetch profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return <div>Profile not found</div>
    }

    return <ProfileEditHub profile={profile} />
}
