import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import PublicProfileClient from './PublicProfileClient'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ username: string }>
}

export default async function PublicProfilePage({ params }: PageProps) {
    const { username } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .single()

    if (!profile) {
        notFound()
    }

    // Check if viewing own profile
    const isOwner = user?.id === profile.id

    // Fetch career history
    const { data: career } = await supabase
        .from('career_history')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_date', { ascending: false })

    // Fetch skills
    const skills = profile.skills || []

    //Fetch media
    const { data: mediaItems } = await supabase
        .from('profile_media')
        .select('*')
        .eq('user_id', profile.id)
        .order('sort_order', { ascending: true })

    // Fetch recommendations
    const { data: recommendations } = await supabase
        .from('recommendations')
        .select('*, from_profile:profiles!recommendations_from_user_id_fkey(id, username, full_name, avatar_url)')
        .eq('to_user_id', profile.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

    // Check verification status
    const isVerified = profile.role === 'verified' || profile.role === 'founder' || profile.role === 'superadmin'

    return (
        <PublicProfileClient
            profile={profile}
            isVerified={isVerified}
            isOwner={isOwner}
            career={career || []}
            skills={skills}
            mediaItems={mediaItems || []}
            recommendations={recommendations || []}
            vehicles={[]}
            collections={[]}
        />
    )
}
