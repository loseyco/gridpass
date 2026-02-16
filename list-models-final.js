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
        fs.writeFileSync('models_final.json', data);
        console.log('Saved to models_final.json');
    });
}).on('error', (e) => console.error(e));
