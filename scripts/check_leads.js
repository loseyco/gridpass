const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    console.log('🔍 Checking recent leads...');
    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (leads.length === 0) {
        console.log('No leads found.');
    } else {
        leads.forEach(l => {
            console.log(`- [${l.created_at}] ${l.name} (${l.role})`);
            if (l.contact_info && l.contact_info.avatar_url) {
                console.log(`  📸 Avatar: ${l.contact_info.avatar_url}`);
                console.log(`  📝 Bio: ${l.contact_info.bio ? l.contact_info.bio.substring(0, 50) + '...' : 'None'}`);

                // Fetch token
                supabase.from('claim_tokens').select('token').eq('entity_id', l.id).single()
                    .then(({ data }) => {
                        if (data) console.log(`  🔗 Claim: http://localhost:3000/claim/${data.token}`);
                    });
            } else {
                console.log('  ⚠️ No rich profile data yet.');
            }
        });
    }
}

check();
