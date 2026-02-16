const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        console.error('No API Key');
        return;
    }
    const genAI = new GoogleGenerativeAI(key);
    // Use gemini-pro (fallback)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    try {
        console.log('Testing gemini-pro...');
        const result = await model.generateContent('Hello');
        const response = await result.response;
        console.log('Success:', response.text());
    } catch (error) {
        console.error('Failed:', error.message);
    }
}

run();
