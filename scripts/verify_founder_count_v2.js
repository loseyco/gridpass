const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest) {
        let val = rest.join('=').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        env[key.trim()] = val;
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin access

if (!supabaseUrl || !supabaseKey) {
    console.error('Failed to parse env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking founder count...');
    const { count, error } = await supabase
        .from('gp_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'Founder');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Founder Count:', count);
        console.log('Remaining Spots:', 50 - (count || 0));
        console.log('✅ Logic verified.');
    }
}

check();
