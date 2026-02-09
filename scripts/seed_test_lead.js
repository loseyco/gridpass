const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
    console.log('🌱 Seeding test lead...');

    const { data: lead, error } = await supabase
        .from('leads')
        .insert({
            name: 'Stig Cousin',
            role: 'Test Driver',
            primary_skill: 'Precision Driving',
            skills: ['Cornering', 'Silence', 'Music'],
            status: 'new',
            source_link: 'http://localhost/test',
            source_post_id: null
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating lead:', error);
        return;
    }

    console.log(`✅ Created Lead: ${lead.id}`);

    // Generate Token
    const token = 'test_' + Math.random().toString(36).substring(7);

    const { data: tokenData, error: tokenError } = await supabase
        .from('claim_tokens')
        .insert({
            entity_type: 'lead',
            entity_id: lead.id,
            token: token
        })
        .select()
        .single();

    if (tokenError) {
        console.error('Error creating token:', tokenError);
        return;
    }

    console.log(`\n🎉 TEST URL: http://localhost:3000/claim/${token}`);
}

seed();
