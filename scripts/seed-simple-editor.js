const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    const app = {
        name: 'Simple Profile Editor',
        slug: 'simple-editor',
        schema: {
            component: 'Container',
            props: { style: { padding: '2rem' } },
            children: [
                {
                    component: 'GridInput',
                    props: { label: 'Full Name', name: 'fn' },
                    bind: 'os_user_profiles.first_name'
                },
                {
                    component: 'GridInput',
                    props: { label: 'Bio', name: 'bio' },
                    bind: 'os_user_profiles.bio'
                }
            ]
        }
    };

    const { error } = await supabase.from('os_apps').upsert(app, { onConflict: 'slug' });

    if (error) {
        console.error('Error seeding:', error);
    } else {
        console.log('Seeded simple-editor');
    }
}

seed();
