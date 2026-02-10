const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
    console.log('Fetching Schema for profile_messages...');
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${serviceRoleKey}`);
    const json = await res.json();

    if (json.definitions && json.definitions.profile_messages) {
        console.log('Definition found:');
        console.log(JSON.stringify(json.definitions.profile_messages.properties, null, 2));
    } else {
        console.log('Table profile_messages not found in definitions.');
    }
}

run();
