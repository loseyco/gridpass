const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const key = process.env.GOOGLE_API_KEY;
if (!key) {
    console.error('No API Key found');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('models4.json', data);
        console.log('Done writing models4.json');
    });
}).on('error', (e) => console.error(e));
