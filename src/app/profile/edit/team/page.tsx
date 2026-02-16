import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TeamInfoEditor from '../TeamInfoEditor'

export default async function TeamInfoPage() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?next=/profile/edit/team')
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

    return <TeamInfoEditor profile={profile} />
}
