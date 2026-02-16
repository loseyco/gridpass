const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const key = process.env.GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    try {
        console.log('Sending request...');
        const result = await model.generateContent('Hello');
        console.log('Success:', result.response.text());
    } catch (error) {
        console.error('Failed!');
        let errorLog = `Error Name: ${error.name}\n`;
        errorLog += `Error Message: ${error.message}\n`;
        if (error.response) {
            errorLog += `Status: ${error.response.status}\n`;
            errorLog += `StatusText: ${error.response.statusText}\n`;
            errorLog += `Body: ${JSON.stringify(error.response, null, 2)}\n`;
        }
        fs.writeFileSync('gemini-error.log', errorLog);
        console.log('Error details written to gemini-error.log');
    }
}

run();
