require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Config
const TARGET_USERNAME = 'pjlosey';

async function main() {
    console.log(`🐞 Debugging Garage for user: ${TARGET_USERNAME}...`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials in .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check if tables exist by querying schema
    try {
        const { data, error } = await supabase.from('user_vehicles').select('count').limit(1);
        if (error) {
            console.error('❌ Table `user_vehicles` does not seem to exist or is inaccessible:', error.message);
        } else {
            console.log('✅ Table `user_vehicles` exists.');
        }
    } catch (e) {
        console.error('❌ Connection or schema error:', e.message);
    }

    try {
        const { data, error } = await supabase.from('user_tools').select('count').limit(1);
        if (error) {
            console.error('❌ Table `user_tools` does not seem to exist or is inaccessible:', error.message);
        } else {
            console.log('✅ Table `user_tools` exists.');
        }
    } catch (e) {
        console.error('❌ Connection or schema error:', e.message);
    }

    // 2. Try inserting a test vehicle
    try {
        // Get user ID first
        const { data: profile } = await supabase.from('profiles').select('id').eq('username', TARGET_USERNAME).single();
        if (!profile) {
            console.error('❌ Could not find user profile.');
            return;
        }

        const { error: insertError } = await supabase.from('user_vehicles').insert({
            user_id: profile.id,
            type: 'Test',
            make: 'TestMake',
            model: 'TestModel',
            year: 2024,
            description: 'Debug insert'
        });

        if (insertError) {
            console.error('❌ Insert failed:', insertError.message);
        } else {
            console.log('✅ Insert successful! (You should see this in the UI)');
        }

    } catch (e) {
        console.error('❌ Unexpected error:', e.message);
    }
}

main();
