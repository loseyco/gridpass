const https = require('https');
require('dotenv').config({ path: '.env.local' });

const key = process.env.GOOGLE_API_KEY;
if (!key) { console.error('No Key'); process.exit(1); }

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log('--- MODELS WITH 3 ---');
                json.models.filter(m => m.name.includes('3')).forEach(m => console.log(m.name.replace('models/', '')));
                console.log('--- END ---');
            } else {
                console.log('NO MODELS:', JSON.stringify(json));
            }
        } catch (e) { console.error(e); }
    });
}).on('error', (e) => console.error(e));
