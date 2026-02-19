
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();

    // Fetch manual leads
    const { data: leads, error: leadsError } = await supabase
        .from('os_leads')
        .select('*')
        .order('created_at', { ascending: false });

    // Fetch open-to-work profiles
    const { data: profiles, error: profilesError } = await supabase
        .from('os_user_profiles')
        .select('*')
        .eq('is_open_to_work', true)
        .order('created_at', { ascending: false });

    if (leadsError) {
        return NextResponse.json({ error: leadsError.message }, { status: 500 });
    }

    // Map profiles to AgencyCandidate format
    const profileCandidates = (profiles || []).map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username,
        role: profile.target_role || 'Member',
        skills: profile.job_preferences?.skills || [],
        status: 'new', // Default status for profiles
        source_type: 'profile',
        source_link: `/u/${profile.username}`,
        avatar: profile.avatar_url,
        // Contact & Social
        contact_info: {
            email: "View Profile", // Protected until contact made
            phone: "",
            location: profile.current_location || profile.hometown
        },
        social_links: {
            linkedin: profile.social_links?.linkedin,
            instagram: profile.social_links?.instagram,
            twitter: profile.social_links?.twitter,
            facebook: profile.social_links?.facebook,
        },
        // Extended Info
        availability: profile.job_preferences?.availability || "Open to Work",
        date_of_birth: profile.date_of_birth,
        logistics_info: profile.logistics_info,
        physical_info: profile.physical_info,
        created_at: profile.created_at,
        updated_at: profile.updated_at
    }));

    // Combine and sort by most recent
    const allCandidates = [...profileCandidates, ...(leads || [])].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(allCandidates);
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const body = await request.json();

    const {
        name, role, skills, status, source_type, source_link,
        resume_url, linkedin_url, desired_salary, notes, contact_info,
        date_of_birth, availability, relocation_prefs,
        logistics_info, physical_info, social_links
    } = body;

    const { data: candidate, error } = await supabase
        .from('os_leads')
        .insert({
            name,
            role,
            skills,
            status: status || 'new',
            source_type: source_type || 'lead',
            source_link,
            resume_url,
            linkedin_url,
            desired_salary,
            notes,
            contact_info,
            date_of_birth,
            availability,
            relocation_prefs,
            logistics_info,
            physical_info,
            social_links
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(candidate);
}

export async function PUT(request: Request) {
    const supabase = await createClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
        return NextResponse.json({ error: 'Missing candidate ID' }, { status: 400 });
    }

    const { data: candidate, error } = await supabase
        .from('os_leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(candidate);
}
