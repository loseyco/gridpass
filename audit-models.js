const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const key = process.env.GOOGLE_API_KEY;
if (!key) { console.error('No Key'); process.exit(1); }

async function testModel(modelName) {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: modelName });
    const start = Date.now();
    try {
        process.stdout.write(`Testing ${modelName.padEnd(30)} ... `);
        const result = await model.generateContent('Hi');
        const response = await result.response;
        console.log(`✅ SUCCESS (${Date.now() - start}ms)`);
        return true;
    } catch (e) {
        let status = 'UNKNOWN';
        if (e.message.includes('404')) status = '404 NOT FOUND';
        else if (e.message.includes('429')) status = '429 QUOTA';
        else if (e.message.includes('400')) status = '400 BAD REQUEST';
        else if (e.message.includes('403')) status = '403 FORBIDDEN';
        else status = e.message.split('[')[0].trim();

        console.log(`❌ FAILED: ${status}`);
        return false;
    }
}

// Fetch list first
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
https.get(url, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', async () => {
        try {
            const json = JSON.parse(data);
            if (!json.models) {
                console.error('No models listed via API:', json);
                return;
            }

            console.log(`Found ${json.models.length} models. Testing generation capability...`);

            // Prioritize ones that look like content generators
            const candidates = json.models
                .map(m => m.name.replace('models/', ''))
                .filter(n => !n.includes('embedding') && !n.includes('vision') && !n.includes('aqa'));

            console.log(`Testing ${candidates.length} candidate text models:\n`);

            for (const name of candidates) {
                await testModel(name);
            }

        } catch (e) { console.error(e); }
    });
});
