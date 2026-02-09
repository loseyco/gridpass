const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    console.log('👀 Finding latest scraped post...');
    const { data: posts, error } = await supabase
        .from('scraped_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !posts || posts.length === 0) {
        console.error('No scraped posts found!', error);
        return;
    }

    const post = posts[0];
    console.log('📝 Found Post:', post.raw_content.substring(0, 50) + '...');

    // 2. Create Lead Entry (Fallback since 'jobs' table schema is partial)
    console.log('🤖 Simulating "Agent Analysis" (Creating Lead)...');

    // Create a Lead representing the Hiring Manager or Candidate
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
            source_post_id: post.id,
            name: 'IndyCar Hiring Manager', // Or extracted name
            role: 'Team Principle',
            primary_skill: 'Team Management',
            status: 'new',
            skills: ['Recruiting', 'IndyCar', 'Management']
        })
        .select()
        .single();

    if (leadError) {
        console.error('Error creating lead:', JSON.stringify(leadError, null, 2));
        return;
    }

    console.log('✅ Created Lead Entry:', lead.id);

    // 3. Create Claim Token
    const tokenString = 'live_' + Math.random().toString(36).substring(7);

    // Check if token exists (unlikely but good practice)

    const { error: tokenError } = await supabase
        .from('claim_tokens')
        .insert({
            entity_type: 'lead', // Changed from 'job'
            entity_id: lead.id,
            token: tokenString
        });

    if (tokenError) {
        console.error('Token Error:', tokenError);
    } else {
        console.log('\n🎉 SUCCESS! LIVE SAMPLE READY.');
        console.log('CLAIM LINK: http://localhost:3000/claim/' + tokenString);
    }
}

run();
