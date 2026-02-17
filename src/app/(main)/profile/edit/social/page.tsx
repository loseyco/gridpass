import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SocialLinksEditor from './SocialLinksEditor'

export default async function SocialEditPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?next=/profile/edit/social')
    }

    // Fetch profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('social_links, website')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return <div>Profile not found</div>
    }

    return <SocialLinksEditor profile={profile} />
}
