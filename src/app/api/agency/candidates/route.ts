
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // 1. Fetch Leads
    let leadsQuery = supabase
        .from('os_leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (status) {
        leadsQuery = leadsQuery.eq('status', status);
    }

    // 2. Fetch Profiles (Open to Work)
    // Only fetch if status is not specified or if status is 'new'/'approved' (profiles are implicitly approved/active)
    let profilesData: any[] = [];
    if (!status || status === 'approved' || status === 'new') {
        const { data: profiles, error: profilesError } = await supabase
            .from('os_user_profiles')
            .select('*')
            .eq('is_open_to_work', true)
            .limit(50); // Valid limit to prevent huge payloads

        if (!profilesError && profiles && profiles.length > 0) {
            // Fetch skills for these users
            const userIds = profiles.map(p => p.id);
            const { data: skillsData } = await supabase
                .from('os_user_skills')
                .select('user_id, skill')
                .in('user_id', userIds);

            profilesData = profiles.map(p => {
                const userSkills = skillsData?.filter(s => s.user_id === p.id).map(s => s.skill) || [];
                const fullName = p.first_name && p.last_name
                    ? `${p.first_name} ${p.last_name}`
                    : (p.first_name || p.username);

                return {
                    id: p.id,
                    user_id: p.id,
                    name: fullName,
                    role: p.target_role,
                    primary_skill: userSkills[0] || null,
                    skills: userSkills,
                    status: 'approved', // Profiles are verified users
                    source_link: `/u/${p.username}`,
                    resume_url: p.cv_url,
                    linkedin_url: (p.social_links as any)?.linkedin || null,
                    desired_salary: null, // Add to schema later if needed
                    notes: p.bio,
                    contact_info: {
                        avatar_url: p.avatar_url,
                        email: null
                    },
                    created_at: p.created_at,
                    source_type: 'profile',
                    username: p.username
                };
            });
        }
    }

    const { data: leads, error } = await leadsQuery;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Combine and sort by date
    const allCandidates = [...profilesData, ...leads].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(allCandidates);
}

export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate fields
    if (!body.name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('os_leads')
        .insert({
            ...body,
            user_id: session.user.id
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
