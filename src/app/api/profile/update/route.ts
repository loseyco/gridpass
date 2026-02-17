import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get request body
        const body = await request.json()
        const {
            full_name,
            bio,
            location,
            website,
            career_history,
            skills,
            social_links,
            job_preferences,
            avatar_url,
            cover_url
        } = body

        // Update profile
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name,
                bio,
                location,
                website,
                career_history,
                skills,
                social_links,
                job_preferences,
                avatar_url,
                cover_url,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

        if (error) {
            console.error('Profile update error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Profile update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
