const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupTestResumes() {
    console.log('🧹 Starting cleanup of test resume submissions...\n');

    // 1. Get all resume leads
    const { data: allLeads, error: fetchError } = await supabase
        .from('resume_leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (fetchError) {
        console.error('Error fetching resume leads:', fetchError);
        return;
    }

    // 2. Filter for test resumes (containing test keywords)
    const testKeywords = [
        'test',
        'redirect',
        'verification',
        'demo',
        'sample',
        'example',
        'dummy',
        'fake'
    ];

    const testLeads = allLeads.filter(lead => {
        const name = (lead.name || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        return testKeywords.some(keyword =>
            name.includes(keyword) || email.includes(keyword)
        );
    });

    console.log(`Found ${testLeads.length} test resume leads to clean up:`);
    testLeads.forEach(lead => {
        console.log(`  - ${lead.name} (${lead.email}) - ID: ${lead.id}`);
    });
    console.log('');

    if (testLeads.length === 0) {
        console.log('✅ No test resumes to clean up!');
        return;
    }

    // 3. For each test lead, clean up associated data
    for (const lead of testLeads) {
        console.log(`\n🗑️  Cleaning up ${lead.name}...`);

        // Delete claim tokens if user_id exists
        if (lead.user_id) {
            const { error: tokenError } = await supabase
                .from('claim_tokens')
                .delete()
                .eq('entity_id', lead.user_id);

            if (tokenError) {
                console.error('  ❌ Error deleting claim tokens:', tokenError.message);
            } else {
                console.log('  ✅ Deleted claim tokens');
            }

            // Delete profile
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', lead.user_id);

            if (profileError) {
                console.error('  ❌ Error deleting profile:', profileError.message);
            } else {
                console.log('  ✅ Deleted profile');
            }

            // Delete user from auth
            const { error: authError } = await supabase.auth.admin.deleteUser(lead.user_id);

            if (authError) {
                console.error('  ❌ Error deleting auth user:', authError.message);
            } else {
                console.log('  ✅ Deleted auth user');
            }
        }

        // Delete the resume lead itself
        const { error: leadError } = await supabase
            .from('resume_leads')
            .delete()
            .eq('id', lead.id);

        if (leadError) {
            console.error('  ❌ Error deleting resume lead:', leadError.message);
        } else {
            console.log('  ✅ Deleted resume lead');
        }
    }

    console.log(`\n✅ Cleanup complete! Removed ${testLeads.length} test resume submissions.`);
}

cleanupTestResumes().catch(console.error);
