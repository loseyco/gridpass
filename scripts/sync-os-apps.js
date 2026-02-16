const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic Schema definition since we can't import TS easily in this script
const RESUME_BUILDER_SCHEMA = {
    component: 'GridStepWizard',
    props: {
        steps: [
            {
                id: 'intro',
                title: 'Welcome',
                description: 'Let\'s set up your driver profile.',
                content: {
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
                        }
                    ]
                }
            },
            {
                id: 'logistics',
                title: 'Logistics',
                description: 'Where are you based?',
                content: {
                    component: 'Container',
                    children: [
                        {
                            component: 'GridInput',
                            props: { label: 'Home Base', name: 'home_base', placeholder: 'e.g. São Paulo, Brazil' },
                            bind: 'os_user_logistics.home_base'
                        },
                        {
                            component: 'GridInput',
                            props: { label: 'Passport / Nationality', name: 'citizenship', placeholder: 'e.g. Brazilian' },
                            bind: 'os_user_logistics.citizenship'
                        }
                    ]
                }
            },
            {
                id: 'work',
                title: 'Experience',
                description: 'Add your most recent role.',
                content: {
                    component: 'Container',
                    children: [
                        {
                            component: 'GridInput',
                            props: { label: 'Team / Organization', name: 'current_team', placeholder: 'e.g. McLaren' },
                            bind: 'os_user_work_history[0].team_name'
                        },
                        {
                            component: 'GridInput',
                            props: { label: 'Role', name: 'current_role', placeholder: 'e.g. Driver' },
                            bind: 'os_user_work_history[0].role'
                        }
                    ]
                }
            },
            {
                id: 'skills',
                title: 'Skills',
                description: 'What are your strengths?',
                content: {
                    component: 'Container',
                    children: [
                        {
                            component: 'GridBadgePicker',
                            props: {
                                label: 'Core Skills',
                                name: 'skills',
                                options: ['Race Craft', 'Wet Weather', 'Qualifying', 'Engineering Feedback', 'Sim Racing', 'Data Analysis']
                            },
                            bind: 'os_user_skills'
                        }
                    ]
                }
            },
            {
                id: 'review',
                title: 'Review',
                description: 'You are ready to launch.',
                content: {
                    component: 'Container',
                    children: [
                        {
                            component: 'Container',
                            props: { children: 'Your profile is ready to join the grid.', style: { fontSize: '1.2rem', color: '#4caf50', marginBottom: '1rem' } }
                        },
                        {
                            component: 'GridToggle',
                            props: { label: 'Publicly Visible?', name: 'is_public' },
                            bind: 'os_user_profiles.is_public' // Assuming column exists or we add it
                        }
                    ]
                }
            }
        ]
    }
};

async function syncApps() {
    // Load envs from .env.local if possible, or expect them in process
    // For this run, we expect the user to have them set or we paste them.
    // Actually, asking user to run this might be better if we don't have direct env access in this context easily.
    // relying on process.env assuming we run via `node --env-file=.env.local` or similar.

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.RESET_DB_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;// Service role prefered for writing

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const apps = [
        {
            slug: 'resume-builder',
            name: 'Paddock Resume Builder',
            description: 'The official GridPass guided onboarding.',
            icon: 'FileText',
            schema: RESUME_BUILDER_SCHEMA
        }
    ];

    for (const app of apps) {
        const { data, error } = await supabase
            .from('os_apps')
            .upsert(app, { onConflict: 'slug' })
            .select();

        if (error) {
            console.error(`Error syncing ${app.slug}:`, error);
        } else {
            console.log(`Synced app: ${app.slug}`);
        }
    }
}

syncApps();
