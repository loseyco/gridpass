import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BasicInfoEditor from '../BasicInfoEditor'

export default async function BasicInfoPage() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?next=/profile/edit/basic')
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

    return <BasicInfoEditor profile={profile} />
}
