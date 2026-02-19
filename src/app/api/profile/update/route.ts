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
            cover_url,
            public_phone,
            public_email,
            show_public_phone,
            show_public_email
        } = body

        // Update profile
        const { error: errorProfiles } = await supabase
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
                public_phone,
                public_email,
                show_public_phone,
                show_public_email,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

        if (errorProfiles) {
            console.error('Profile update error (profiles):', errorProfiles)
            return NextResponse.json({ error: errorProfiles.message }, { status: 500 })
        }

        // Also update os_user_profiles
        // Note: Some fields might need mapping or are distinct.
        // For now, mapping what we have.
        const { error: errorOS } = await supabase
            .from('os_user_profiles')
            .update({
                first_name: full_name?.split(' ')[0] || '',
                last_name: full_name?.split(' ').slice(1).join(' ') || '',
                bio,
                current_location: location, // Mapping location -> current_location
                avatar_url,
                cover_photo_url: cover_url, // Mapping cover_url -> cover_photo_url
                public_phone,
                public_email,
                show_public_phone,
                show_public_email,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

        if (errorOS) {
            console.error('Profile update error (os_user_profiles):', errorOS)
            // Not failing the whole request if OS update fails but logging it?
            // Or should we fail? Better to fail so user knows.
            return NextResponse.json({ error: errorOS.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Profile update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
