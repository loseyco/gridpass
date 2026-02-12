const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bwpmqsdykumtfusflhri.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cG1xc2R5a3VtdGZ1c2ZsaHJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTcyMDkwNCwiZXhwIjoyMDg1Mjk2OTA0fQ.6TjsEzSU5DZBV68h11oxbsOxoCLhBNa5F2oT146D_ow';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser(email) {
    console.log(`Checking for user with email: ${email}`);

    // 1. Check Auth User
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.log('User NOT found in auth.users');
        return;
    }
    console.log(`User FOUND: ${user.id}`);

    // 2. Check Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile) {
        console.log('Profile FOUND:', profile.username);
    } else {
        console.log('Profile NOT found');
    }

    // 3. Check Claim Token
    const { data: tokens, error: tokenError } = await supabase
        .from('claim_tokens')
        .select('*')
        .eq('entity_id', user.id);

    console.log('Claim Tokens found:', tokens?.length || 0);
    if (tokens?.length > 0) {
        console.log('Token Details:', tokens);
    } else {
        // Check for any tokens for this email just in case
        console.log('Checking for tokens by ANY entity_id...');
    }
}

const email = 'verification.user1234@example.com';
checkUser(email);
