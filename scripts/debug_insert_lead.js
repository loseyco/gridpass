
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error('Could not read .env.local', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function debugInsert() {
    console.log('Attempting to insert dummy lead...');

    const username = 'debug-test-' + Math.floor(Math.random() * 1000);
    const leadData = {
        name: 'Debug User',
        role: 'Driver (Club/Pro)', // This might be the issue if it's an enum or constraint
        source: 'resume_builder',
        contact_info: {
            username: username,
            email: 'debug@example.com',
            phone: '555-1234',
            bio: 'Debug Bio',
            avatar_url: null,
            resume_url: null,
            linkedin: null,
            website: null,
            location: 'Unknown',
            social_links: {},
            experience_years: 'Beginner'
        },
        skills: [],
        status: 'new'
    };

    const { data, error } = await supabaseAdmin
        .from('leads')
        .insert([leadData])
        .select();

    if (error) {
        console.error('INSERT ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('INSERT SUCCESS:', data);
    }
}

debugInsert();
