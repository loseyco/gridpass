const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const key = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(key);

async function check() {
    console.log("Fetching models...");
    const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const modelsData = await modelsResponse.json();

    if (!modelsData.models) {
        console.error("No models found or API error:", modelsData);
        return;
    }

    const workingModels = [];
    // Filter for gemini or gemma
    const candidates = modelsData.models
        .map(m => m.name.replace('models/', ''))
        .filter(n => n.includes('gemini') || n.includes('gemma'));

    console.log(`Testing ${candidates.length} candidates...`);

    for (const name of candidates) {
        try {
            const model = genAI.getGenerativeModel({ model: name });
            await model.generateContent('Hi'); // Simple generation test
            console.log(`✅ ${name} WORKS`);
            workingModels.push(name);
        } catch (e) {
            let status = 'Error';
            if (e.message.includes('404')) status = '404';
            if (e.message.includes('429')) status = '429';
            process.stdout.write(`❌ ${name} (${status}) `);
        }
    }

    console.log("\n\n--- WORKING MODELS ---");
    console.log(workingModels.join('\n'));
    fs.writeFileSync('working_models.txt', workingModels.join('\n'));
}

check();
