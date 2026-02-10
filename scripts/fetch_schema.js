const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
    console.log('Fetching Schema...');
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${serviceRoleKey}`);
    const json = await res.json();

    // Look for definitions
    if (json.definitions && json.definitions.classifieds) {
        console.log('Provide definitions for classifieds:');
        const props = json.definitions.classifieds.properties;
        if (props.category) {
            console.log('Category Type:', props.category.type);
            console.log('Category Enum:', props.category.enum);
            console.log('Category Format:', props.category.format);
        }
    } else {
        console.log('Definitions not found or classifieds not found.');
        console.log(Object.keys(json.definitions || {}));
    }
}

run();
