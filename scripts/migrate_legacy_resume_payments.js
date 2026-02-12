const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateLegacyResumeLeads() {
    console.log('🔍 Checking for legacy resume leads...\n');

    // Get all resume leads with 'unpaid' or null payment_status
    const { data: leads, error } = await supabaseAdmin
        .from('resume_leads')
        .select('id, email, name, created_at, payment_status, stripe_payment_intent_id')
        .or('payment_status.is.null,payment_status.eq.unpaid')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('❌ Error fetching leads:', error);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log('✅ No legacy leads found. All good!');
        return;
    }

    console.log(`📋 Found ${leads.length} legacy resume lead(s):\n`);
    leads.forEach((lead, i) => {
        console.log(`${i + 1}. ${lead.name} (${lead.email})`);
        console.log(`   Created: ${new Date(lead.created_at).toLocaleString()}`);
        console.log(`   Status: ${lead.payment_status || 'null'}`);
        console.log(`   Payment Intent: ${lead.stripe_payment_intent_id || 'none'}\n`);
    });

    console.log('\n🔧 MIGRATION OPTIONS:\n');
    console.log('1. Mark as PAID - For leads that already paid (legacy system)');
    console.log('2. Mark as AUTHORIZED - For leads that pre-authorized but haven\'t been captured');
    console.log('3. Leave UNPAID - For leads that never paid\n');

    // Since this is a script, we'll mark old ones as 'paid' by default
    // You can manually review and adjust as needed
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question('Enter lead IDs to mark as PAID (comma-separated, or "all"): ', async (answer) => {
        let idsToUpdate = [];

        if (answer.toLowerCase() === 'all') {
            idsToUpdate = leads.map(l => l.id);
        } else if (answer.trim()) {
            // Parse comma-separated numbers
            idsToUpdate = answer.split(',').map(n => parseInt(n.trim()) - 1)
                .filter(i => i >= 0 && i < leads.length)
                .map(i => leads[i].id);
        }

        if (idsToUpdate.length === 0) {
            console.log('\n⏭️  No updates made.');
            readline.close();
            return;
        }

        console.log(`\n📝 Updating ${idsToUpdate.length} lead(s) to 'paid' status...`);

        const { error: updateError } = await supabaseAdmin
            .from('resume_leads')
            .update({ payment_status: 'paid' })
            .in('id', idsToUpdate);

        if (updateError) {
            console.error('❌ Error updating leads:', updateError);
        } else {
            console.log('✅ Successfully updated payment status!');
        }

        readline.close();
    });
}

// Run if called directly
if (require.main === module) {
    migrateLegacyResumeLeads()
        .then(() => console.log('\n✅ Migration check complete'))
        .catch(err => console.error('❌ Migration failed:', err))
        .finally(() => process.exit(0));
}

module.exports = { migrateLegacyResumeLeads };
