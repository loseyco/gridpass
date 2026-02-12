
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('Starting cleanup...');

    // 1. Find leads to delete (based on test names/emails)
    const pattern = '%Test%';
    const emailPattern = '%example.com%';

    // 0. Inspect structure
    const { data: firstLead } = await supabase.from('resume_leads').select('*').limit(1).single();
    if (firstLead) {
        console.log('Sample resume_lead:', Object.keys(firstLead));
    }

    // 1. Delete from resume_leads
    // Try 'email' or 'contact_email' or 'contact_info->>email'
    // Based on previous error, 'email' doesn't exist.
    // Let's rely on name for now, or use mapped column.

    const { data: resumeLeads, error: resumeError } = await supabase
        .from('resume_leads')
        .delete()
        .or(`name.ilike.${pattern}`) // Just use name for now to be safe
        .select('id, name');

    if (resumeError) {
        console.error('Error deleting resume_leads:', resumeError);
    } else {
        console.log(`Deleted ${resumeLeads.length} resume_leads.`);
        resumeLeads.forEach(l => console.log(` - ${l.name} (${l.id})`));
    }

    // 2. Delete from leads (shadow profiles)
    // We can't easily join in delete, so we'll fetch IDs first or use similar pattern
    const { data: leads, error: leadsFetchError } = await supabase
        .from('leads')
        .select('id, name')
        .or(`name.ilike.${pattern},name.ilike.RedirectTest%,name.ilike.GuestPayment%,name.ilike.UniqueTest%`);

    if (leadsFetchError) {
        console.error('Error fetching leads:', leadsFetchError);
    } else if (leads && leads.length > 0) {
        const ids = leads.map(l => l.id);

        // Delete claim tokens first (FK)
        const { error: tokensError } = await supabase
            .from('claim_tokens')
            .delete()
            .in('entity_id', ids);

        if (tokensError) console.error('Error deleting tokens:', tokensError);

        // Delete leads
        const { error: leadsError } = await supabase
            .from('leads')
            .delete()
            .in('id', ids);

        if (leadsError) {
            console.error('Error deleting leads:', leadsError);
        } else {
            console.log(`Deleted ${ids.length} leads.`);
            leads.forEach(l => console.log(` - ${l.name}`));
        }
    } else {
        console.log('No matching leads found.');
    }

    console.log('Cleanup complete.');
}

cleanup();
