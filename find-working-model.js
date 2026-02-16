const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) { console.error('No Key'); process.exit(1); }

    const genAI = new GoogleGenerativeAI(key);

    const candidates = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-1.0-pro',
        'gemini-pro',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest'
    ];

    console.log('Testing models...');

    for (const modelName of candidates) {
        try {
            console.log(`Trying ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hi');
            const response = await result.response;
            console.log(`SUCCESS: ${modelName}`);
            process.exit(0); // Exit on first success
        } catch (e) {
            console.log(`FAILED: ${modelName} (${e.message.split('[')[0]})`);
        }
    }
    console.log('ALL FAILED');
    process.exit(1);
}

run();
