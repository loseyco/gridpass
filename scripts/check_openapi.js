require('dotenv').config({ path: '.env.local' });
const https = require('https');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('Missing credentials');
    process.exit(1);
}

const apiUrl = `${url}/rest/v1/?apikey=${key}`;

console.log('Fetching OpenAPI spec from:', new URL(apiUrl).origin);

https.get(apiUrl, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const def = json.definitions['os_user_profiles'];

            if (!def) {
                console.error('os_user_profiles definition NOT FOUND');
                console.log('Available definitions:', Object.keys(json.definitions || {}).slice(0, 5));
                return;
            }

            console.log('Columns in os_user_profiles:', Object.keys(def.properties || {}));

            const hasFullName = !!def.properties['full_name'];
            if (hasFullName) {
                console.log('full_name column EXISTS in cache.');
            } else {
                console.log('full_name column MISSING in cache.');
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw Data Start:', data.substring(0, 100));
        }
    });

}).on('error', (err) => {
    console.error('Error fetching spec:', err.message);
});
