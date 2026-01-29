
const fs = require('fs');
const path = require('path');

// Configuration
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'deepseek-r1:7b'; // Or 'llama3'

// Get the prompt from command line arguments
const userPrompt = process.argv[2];
const outputFile = process.argv[3] || 'generated_output.ts';

if (!userPrompt) {
    console.error('❌ Please provide a prompt.');
    console.error('Usage: node scripts/codegen.js "Your prompt here" [output_filename]');
    process.exit(1);
}

async function generateCode() {
    console.log(`🧠 Local AI (${MODEL}) is thinking...`);
    console.log(`📝 Prompt: "${userPrompt}"`);
    console.log('-----------------------------------');

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                prompt: `You are an expert Full Stack TypeScript developer. 
                Write code for the following request. 
                Provide ONLY the code block, no markdown formatting or explanation if possible.
                
                Request: ${userPrompt}
                `,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.response;

        // Strip markdown code blocks if present (DeepSeek loves to chat)
        let cleanContent = content.replace(/```typescript|```tsx|```javascript|```/g, '');

        // Strip <think> tags (Reasoning models)
        cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/g, '');

        // Write to file
        const finalPath = path.join(process.cwd(), outputFile);
        fs.writeFileSync(finalPath, cleanContent.trim());

        console.log(`✅ Code generated successfully!`);
        console.log(`📂 Saved to: ${outputFile}`);
        console.log('-----------------------------------');
        console.log(cleanContent.trim().substring(0, 200) + '...');
        console.log('-----------------------------------');

    } catch (error) {
        console.error('🔥 Error generating code:', error.message);
    }
}

generateCode();
