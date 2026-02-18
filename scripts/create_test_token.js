const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTestToken() {
    console.log('🧪 Creating Test Token...');

    // 1. Get or Create Lead
    let { data: lead } = await supabase
        .from('os_lead')
        .select('*')
        .eq('name', 'Test Driver')
        .single();

    if (!lead) {
        const { data: newLead, error } = await supabase.from('os_lead').insert({
            name: 'Test Driver',
            role: 'Pro Max Driver',
            source_link: 'http://example.com',
            status: 'new',
            contact_info: { email: 'test@example.com' }
        }).select().single();

        if (error) {
            console.error('Error creating lead:', error);
            return;
        }
        lead = newLead;
    }

    console.log(`   👤 Lead: ${lead.name} (${lead.id})`);

    // 2. Create Token
    const token = 'test_' + Math.random().toString(36).substring(7);
    const { error: tokenError } = await supabase.from('os_claim_token').insert({
        entity_type: 'lead',
        entity_id: lead.id,
        token: token
    });

    if (tokenError) {
        console.error('Error creating token:', tokenError);
        return;
    }

    const url = `http://localhost:3000/claim/${token}`;
    console.log(`\n✅ Test URL Created:\n${url}`);
}

createTestToken();
