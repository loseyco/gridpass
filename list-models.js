const https = require('https');
require('dotenv').config({ path: '.env.local' });

const key = process.env.GOOGLE_API_KEY;
if (!key) {
    console.error('No API Key found');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

const fs = require('fs');
// ... (keep imports)

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('models3.json', data);
        console.log('Wrote models to models3.json');
    });
}).on('error', (e) => console.error(e));
