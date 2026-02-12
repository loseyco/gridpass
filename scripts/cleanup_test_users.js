const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function cleanup() {
    console.log('🧹 Starting cleanup of test accounts...');

    // 1. Identify Target Emails/Names
    const targetNames = ['Arvid Lindblad', 'Test User', 'IndyCar Hiring Manager'];
    const targetEmails = ['arvid', 'test', 'example.com']; // Loose matching for safety

    // 2. Find and Delete from Resume Leads
    console.log('--- Cleaning Resume Leads ---');
    const { data: resumes } = await supabase
        .from('resume_leads')
        .select('id, name, email')
        .or(`name.in.(${targetNames.map(n => `"${n}"`).join(',')})`);

    // Also search by email pattern if needed, but name is safer for "Arvid"

    if (resumes && resumes.length > 0) {
        console.log(`Found ${resumes.length} resume leads to delete:`, resumes.map(r => r.name));
        const ids = resumes.map(r => r.id);
        const { error } = await supabase.from('resume_leads').delete().in('id', ids);
        if (error) console.error('Error deleting resume leads:', error);
        else console.log('Deleted resume leads.');
    } else {
        console.log('No matching resume leads found.');
    }

    // 3. Find and Delete from Leads (Shadow Profiles)
    console.log('\n--- Cleaning Shadow Leads ---');
    const { data: leads } = await supabase
        .from('leads')
        .select('id, name')
        .or(`name.in.(${targetNames.map(n => `"${n}"`).join(',')})`);

    if (leads && leads.length > 0) {
        console.log(`Found ${leads.length} leads to delete:`, leads.map(l => l.name));
        const ids = leads.map(l => l.id);
        // Delete claim tokens first if no cascade (though usually cascade handles it)
        await supabase.from('claim_tokens').delete().in('entity_id', ids);

        const { error } = await supabase.from('leads').delete().in('id', ids);
        if (error) console.error('Error deleting leads:', error);
        else console.log('Deleted leads.');
    } else {
        console.log('No matching leads found.');
    }

    // 4. Delete Auth Users
    console.log('\n--- Cleaning Auth Users ---');
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    const usersToDelete = users.filter(u => {
        const email = u.email || '';
        // Match Arvid or generic test emails
        return email.includes('arvid') || email.includes('test') || email.includes('example');
    });

    if (usersToDelete.length > 0) {
        console.log(`Found ${usersToDelete.length} auth users to delete:`, usersToDelete.map(u => u.email));
        for (const user of usersToDelete) {
            const { error } = await supabase.auth.admin.deleteUser(user.id);
            if (error) console.error(`Failed to delete user ${user.email}:`, error);
            else console.log(`Deleted user ${user.email}`);
        }
    } else {
        console.log('No matching auth users found.');
    }

    console.log('\n✨ Cleanup Complete.');
}

cleanup();
