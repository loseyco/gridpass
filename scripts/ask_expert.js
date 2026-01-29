
const fs = require('fs');
const path = require('path');

// Configuration
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'deepseek-r1:7b'; // Or 'llama3'

// Arguments
const expertType = process.argv[2]; // e.g., "frontend", "backend"
const userPrompt = process.argv[3];
const outputFile = process.argv[4]; // Optional

if (!expertType || !userPrompt) {
    console.error('❌ Usage: node scripts/ask_expert.js <expert_type> "<prompt>" [output_file]');
    console.error('   Example: node scripts/ask_expert.js frontend "Create a new Navbar"');
    console.error('   Experts: frontend, backend');
    process.exit(1);
}

async function askExpert() {
    // 1. Load Expert Context
    const expertPath = path.join(process.cwd(), 'local-ai', 'experts', `${expertType}.md`);
    if (!fs.existsSync(expertPath)) {
        console.error(`❌ Expert type "${expertType}" not found. Create ${expertType}.md in local-ai/experts/`);
        process.exit(1);
    }
    const expertContext = fs.readFileSync(expertPath, 'utf-8');

    // GridPass AI Manager Hook
    const { updateStatus, ensureHud } = require('../local-ai/ai-manager');
    ensureHud();
    updateStatus('thinking', `Expert: ${expertType}`, userPrompt);

    console.log(`🧠 Local AI (${MODEL}) is assuming persona: ${expertType}...`);
    console.log(`📝 Prompt: "${userPrompt}"`);
    console.log('-----------------------------------');

    try {
        const fullPrompt = `
        ${expertContext}

        USER REQUEST:
        ${userPrompt}

        Please provide the code or answer below. Do not include <think> tags or markdown code blocks in the final output if writing to a file.
        `;

        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                prompt: fullPrompt,
                stream: false,
                options: {
                    temperature: 0.2 // Lower temp for more precise/expert answers
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        const data = await response.json();
        let content = data.response;

        // Strip <think> tags
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '');

        // Output logic
        if (outputFile) {
            // Strip code blocks for file output
            content = content.replace(/```typescript|```tsx|```javascript|```/g, '');
            const finalPath = path.join(process.cwd(), outputFile);
            fs.writeFileSync(finalPath, content.trim());
            console.log(`✅ Solution saved to: ${outputFile}`);
        } else {
            console.log(content.trim());
        }

    } catch (error) {
        console.error('🔥 Error asking expert:', error.message);
        const { updateStatus } = require('../local-ai/ai-manager');
        updateStatus('error', `Expert: ${expertType}`, error.message);
    } finally {
        const { updateStatus } = require('../local-ai/ai-manager');
        updateStatus('idle', null, 'Last run finished.');
    }
}

askExpert();
