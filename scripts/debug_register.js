const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testRegistration() {
    const email = `test_debug_${Date.now()}@example.com`;
    const password = 'password123';

    console.log(`Attempting to create user: ${email}`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Debug User'
        }
    });

    if (error) {
        console.error('FATAL: Registration failed:', error);
    } else {
        console.log('SUCCESS: User created:', data.user.id);
        // await supabase.auth.admin.deleteUser(data.user.id);
        // console.log('Cleaned up (deleted) user.');
        console.log('User persisted for inspection:', data.user.id);
    }
}

testRegistration();
