require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createUser() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase environment variables');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const email = 'test_auditor_manual@example.com';
    const password = 'Password123!';

    console.log(`Creating user: ${email}...`);

    let { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Test Auditor Manual'
        }
    });

    if (error) {
        console.error('Error creating user:', error.message);
        // If user already exists, try to delete and recreate.
        if (error.message.includes('already been registered')) {
            console.log('User exists. Deleting...');
            // We need the user ID to delete.
            // But we can't get it easily from admin.createUser error.
            // We'll try to list users or get user by email (not available in all admin APIs).
            const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) console.error("List users error:", listError);
            else {
                const user = listData.users.find(u => u.email === email);
                if (user) {
                    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
                    if (deleteError) console.error("Delete error:", deleteError);
                    else {
                        console.log("User deleted. Recreating...");
                        const { data: retryData, error: retryError } = await supabase.auth.admin.createUser({
                            email: email,
                            password: password,
                            email_confirm: true,
                            user_metadata: { full_name: 'Test Auditor Manual' }
                        });
                        if (retryError) console.error("Retry create error:", retryError);
                        else console.log("User recreated successfully:", retryData.user.id);
                    }
                }
            }

        }
    } else {
        console.log('User created successfully:', data.user.id);
    }
}

createUser();
