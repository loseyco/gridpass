
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
    console.log('Inspecting resume_leads...');
    const { data: resumeLeads, error: rlError } = await supabase
        .from('resume_leads')
        .select('*')
        .limit(1);

    if (resumeLeads && resumeLeads.length > 0) {
        console.log('resume_leads columns:', Object.keys(resumeLeads[0]));
    } else {
        console.log('resume_leads empty or error:', rlError);
    }

    console.log('Inspecting leads...');
    const { data: leads, error: lError } = await supabase
        .from('leads')
        .select('*')
        .limit(1);

    if (leads && leads.length > 0) {
        console.log('leads columns:', Object.keys(leads[0]));
    } else {
        console.log('leads empty or error:', lError);
    }
}

inspectSchema();
