const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    console.log("Environment Keys Check:");
    console.log("GEMINI_API_KEY:", !!process.env.GEMINI_API_KEY);
    console.log("GOOGLE_API_KEY:", !!process.env.GOOGLE_API_KEY);
    console.log("OPENAI_API_KEY:", !!process.env.OPENAI_API_KEY);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // There isn't a direct listModels on the client instance in some versions, 
        // but let's try the generic way if the SDK exposes it.
        // Actually looking at docs, it's not always direct.

        // Let's try a simple generation with a few known candidates to see which one works.
        const candidates = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-1.5-pro-001",
            "gemini-pro"
        ];

        console.log("Testing models...");

        for (const modelName of candidates) {
            try {
                const m = genAI.getGenerativeModel({ model: modelName });
                const result = await m.generateContent("Hello");
                const response = await result.response;
                console.log(`✅ SUCCESS: ${modelName}`);
                return; // Found one!
            } catch (e) {
                console.log(`❌ FAILED: ${modelName} - ${e.message}`);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

listModels();
