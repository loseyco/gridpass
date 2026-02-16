import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ADVANCED Schema 
const RESUME_BUILDER_SCHEMA_ADVANCED = {
    component: 'GridStepWizard',
    props: {
        steps: [
            { title: 'Identity', description: "Who are you?" },
            { title: 'Bio & Web', description: "Tell your story." },
            { title: 'Socials', description: "Connect your channels." },
            { title: 'Role 1', description: "Most Recent Position" },
            { title: 'Role 2', description: "Previous Position" },
            { title: 'Role 3', description: "Previous Position" },
            { title: 'Logistics', description: "Travel & Base" },
            { title: 'Skills', description: "Core Competencies" },
            { title: 'Review', description: "Ready to launch." }
        ]
    },
    children: [
        // Step 1: Identity
        {
            component: 'Container',
            children: [
                {
                    component: 'GridInput',
                    props: { label: 'First Name', name: 'first_name', placeholder: 'e.g. Ayrton', required: true },
                    bind: 'os_user_profiles.first_name'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Last Name', name: 'last_name', placeholder: 'e.g. Senna', required: true },
                    bind: 'os_user_profiles.last_name'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Headline', name: 'headline', placeholder: 'e.g. 3x World Champion' },
                    bind: 'os_user_profiles.headline'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Home Base', name: 'hometown', placeholder: 'e.g. São Paulo' },
                    bind: 'os_user_profiles.hometown'
                }
            ]
        },
        // Step 2: Bio & Web
        {
            component: 'Container',
            children: [
                {
                    component: 'GridInput',
                    props: { label: 'Bio', name: 'bio', placeholder: 'Tell us a bit about yourself...', required: false }, // Ideally multiline, implies standard input for now
                    bind: 'os_user_profiles.bio'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Website', name: 'website', placeholder: 'e.g. https://ayrtonsenna.com' },
                    bind: 'os_user_profiles.website'
                }
            ]
        },
        // Step 3: Socials
        {
            component: 'Container',
            children: [
                {
                    component: 'GridInput',
                    props: { label: 'Instagram URL', name: 'instagram', placeholder: 'https://instagram.com/...' },
                    bind: 'os_user_profiles.social_links.instagram'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Twitter / X URL', name: 'twitter', placeholder: 'https://twitter.com/...' },
                    bind: 'os_user_profiles.social_links.twitter'
                },
                {
                    component: 'GridInput',
                    props: { label: 'LinkedIn URL', name: 'linkedin', placeholder: 'https://linkedin.com/in/...' },
                    bind: 'os_user_profiles.social_links.linkedin'
                }
            ]
        },
        // Step 4: Role 1 (Most Recent)
        {
            component: 'Container',
            children: [
                { component: 'Container', props: { children: "Most Recent Role", style: { fontWeight: 'bold', marginBottom: '1rem', color: '#888' } } },
                {
                    component: 'GridInput',
                    props: { label: 'Team / Organization', name: 'team_0', placeholder: 'e.g. McLaren' },
                    bind: 'os_user_work_history[0].team_name'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Role', name: 'role_0', placeholder: 'e.g. Driver' },
                    bind: 'os_user_work_history[0].role'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Series / Category', name: 'series_0', placeholder: 'e.g. Formula 1' },
                    bind: 'os_user_work_history[0].series'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Description', name: 'desc_0', placeholder: 'Achievements...' },
                    bind: 'os_user_work_history[0].description'
                }
            ]
        },
        // Step 5: Role 2
        {
            component: 'Container',
            children: [
                { component: 'Container', props: { children: "Previous Role", style: { fontWeight: 'bold', marginBottom: '1rem', color: '#888' } } },
                {
                    component: 'GridInput',
                    props: { label: 'Team / Organization', name: 'team_1', placeholder: 'e.g. Lotus' },
                    bind: 'os_user_work_history[1].team_name'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Role', name: 'role_1', placeholder: 'e.g. Driver' },
                    bind: 'os_user_work_history[1].role'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Series', name: 'series_1', placeholder: 'e.g. Formula 1' },
                    bind: 'os_user_work_history[1].series'
                }
            ]
        },
        // Step 6: Role 3
        {
            component: 'Container',
            children: [
                { component: 'Container', props: { children: "Previous Role", style: { fontWeight: 'bold', marginBottom: '1rem', color: '#888' } } },
                {
                    component: 'GridInput',
                    props: { label: 'Team / Organization', name: 'team_2', placeholder: 'e.g. Toleman' },
                    bind: 'os_user_work_history[2].team_name'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Role', name: 'role_2', placeholder: 'e.g. Driver' },
                    bind: 'os_user_work_history[2].role'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Series', name: 'series_2', placeholder: 'e.g. Formula 1' },
                    bind: 'os_user_work_history[2].series'
                }
            ]
        },
        // Step 7: Logistics
        {
            component: 'Container',
            children: [
                {
                    component: 'GridInput',
                    props: { label: 'Nearest Airport', name: 'airport', placeholder: 'e.g. GRU' },
                    bind: 'os_user_logistics.nearest_airport'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Passport Status', name: 'passport', placeholder: 'e.g. Active / Expired' },
                    bind: 'os_user_logistics.passport_status'
                }
            ]
        },
        // Step 8: Skills
        {
            component: 'Container',
            children: [
                {
                    component: 'GridBadgePicker',
                    props: {
                        label: 'Core Skills',
                        name: 'skills',
                        options: ['Race Craft', 'Wet Weather', 'Qualifying', 'Engineering Feedback', 'Sim Racing', 'Data Analysis', 'Sponsorship Management', 'Public Speaking']
                    },
                    bind: 'os_user_skills'
                }
            ]
        },
        // Step 9: Review
        {
            component: 'Container',
            children: [
                {
                    component: 'Container',
                    props: { children: 'Your Full Profile is ready.', style: { fontSize: '1.2rem', color: '#4caf50', marginBottom: '1rem' } }
                },
                {
                    component: 'GridToggle',
                    props: { label: 'Publicly Visible?', name: 'is_public' },
                    bind: 'os_user_profiles.is_public'
                }
            ]
        }
    ]
};

export async function GET() {
    try {
        console.log("Starting Advanced Seeding Process...");

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseServiceKey) {
            throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.")
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        const app = {
            slug: 'resume-builder',
            name: 'Paddock Resume Builder Pro',
            description: 'The complete GridPass career profile builder.',
            icon: 'FileText',
            schema: RESUME_BUILDER_SCHEMA_ADVANCED,
            version: '2.0.0'
        }

        console.log("Upserting Advanced App (v2.0.0):", app.slug);

        const { data, error } = await supabase
            .from('os_apps')
            .upsert(app, { onConflict: 'slug' })
            .select()

        if (error) {
            console.error("Supabase Admin Error:", error);
            return NextResponse.json({ error: error.message, details: error }, { status: 500 })
        }

        console.log("Seeding Success:", data);

        return NextResponse.json({ success: true, data })
    } catch (e: any) {
        console.error("Unexpected Error:", e);
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
    }
}
