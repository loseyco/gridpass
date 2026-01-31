const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found!");
        process.exit(1);
    }

    try {
        console.log("Listing models...");
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!listResponse.ok) {
            console.error("List Models Failed:", listResponse.status);
        } else {
            const listData = await listResponse.json();
            if (listData.models) {
                console.log("Available 'Flash' Models:");
                listData.models
                    .filter(m => m.name.toLowerCase().includes('flash') || m.name.toLowerCase().includes('gemini-1.5'))
                    .forEach(m => console.log(`- ${m.name}`));
            } else {
                console.log("No models found.");
            }
        }
    } catch (err) {
        console.error("Script failed:", err);
    }
}

main();
