const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('🧹 Cleaning up previous confused tests (optional)...');
    // We can leave old data, just focus on new one.

    console.log('👤 Creating Candidate Lead (Seeker)...');
    const { data: lead, error } = await supabase
        .from('leads')
        .insert({
            name: 'Alex Racer',
            role: 'Driver',
            primary_skill: 'Karting',
            status: 'new', // new lead from social
            source_link: 'https://facebook.com/groups/123/posts/456',
            skills: ['Karting', 'Formula 1600']
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating lead:', error);
        return;
    }

    console.log('✅ Created Candidate:', lead.name, `(${lead.role})`);

    // Create Claim Token
    const tokenString = 'resume_help_' + Math.random().toString(36).substring(7);

    await supabase.from('claim_tokens').insert({
        entity_type: 'lead',
        entity_id: lead.id,
        token: tokenString
    });

    console.log('\n🎯 CANDIDATE CLAIM LINK:');
    console.log(`http://localhost:3000/claim/${tokenString}`);
}

run();
