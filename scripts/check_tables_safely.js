const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- TABLE SAFETY CHECK ---');

    // Check Leads
    const { count: leadsCount, error: leadsError } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { count: osLeadCount, error: osLeadError } = await supabase.from('os_lead').select('*', { count: 'exact', head: true });

    console.log(`LEADS_EXISTS: ${!leadsError}`);
    console.log(`LEADS_COUNT: ${leadsCount}`);

    console.log(`OS_LEAD_EXISTS: ${!osLeadError}`);
    console.log(`OS_LEAD_COUNT: ${osLeadCount}`);

    // Check Claim Tokens
    const { count: claimsCount, error: claimsError } = await supabase.from('claim_tokens').select('*', { count: 'exact', head: true });
    const { count: osClaimCount, error: osClaimError } = await supabase.from('os_claim_token').select('*', { count: 'exact', head: true });

    console.log(`CLAIMS_EXISTS: ${!claimsError}`);
    console.log(`CLAIMS_COUNT: ${claimsCount}`);

    console.log(`OS_CLAIM_EXISTS: ${!osClaimError}`);
    console.log(`OS_CLAIM_COUNT: ${osClaimCount}`);

    console.log('--- END CHECK ---');
}

check();
