const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const key = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('models.json', data);
        console.log("Done writing models.json");
    });
}).on('error', (e) => {
    console.error("Req Error:", e);
});
