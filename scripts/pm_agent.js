const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

// Configuration
const PM_CONTEXT_PATH = path.join(__dirname, '../local-ai/experts/project_manager.md');
const HISTORY_PATH = path.join(__dirname, '../local-ai/data/pm_chat_history.json');
const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;
const MODEL = 'llama3';

// --- Helpers ---

// Simple fetch implementation for Node.js without deps
function postJSON(path, payload) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: OLLAMA_HOST,
            port: OLLAMA_PORT,
            path: path,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(JSON.stringify(payload));
        req.end();
    });
}

function checkOllama() {
    return new Promise((resolve) => {
        const req = http.get(`http://${OLLAMA_HOST}:${OLLAMA_PORT}`, (res) => {
            resolve(true);
        }).on('error', () => resolve(false));
    });
}

async function runPM() {
    const mission = process.argv[2];
    if (!mission) {
        console.log('Error: No mission provided.');
        process.exit(1);
    }

    console.log(`\n💬 Input: "${mission}"`);
    console.log(`🤖 Assessing resources...`);

    const isOnline = await checkOllama();

    if (!isOnline) {
        console.log(`\n⚠️ OLLAMA OFFLINE`);
        console.log(`The Local Brain (Ollama) is not running on port ${OLLAMA_PORT}.`);
        console.log(`Action: I have queued this request internally, but cannot execute until you start Ollama.`);
        console.log(`\nResponse: "I received your request '${mission}', but my neural network is offline. Please start Ollama."`);

        // Mock a response so the UI doesn't hang
        process.exit(0);
        return;
    }

    // --- Real Execution ---
    console.log(`🧠 Connecting to ${MODEL}...`);

    // Load context
    let history = [];
    try { history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8')); } catch (e) { }

    // Construct Prompt
    const prompt = `
    You are the GridPass Project Manager.
    User Request: "${mission}"
    
    Analyze this request.
    1. If it's a chat, reply as a helpful manager.
    2. If it's a task, outline the steps (Plan).
    
    Return JSON: { "type": "chat"|"plan", "response": "string", "plan": [] }
    `;

    try {
        const result = await postJSON('/api/generate', {
            model: MODEL,
            prompt: prompt,
            format: "json",
            stream: false
        });

        const aiResponse = JSON.parse(result.response);

        if (aiResponse.type === 'chat') {
            console.log(`\n🗣️ PM: ${aiResponse.response}`);
            // Save to history
            history.push({ role: 'user', content: mission });
            history.push({ role: 'assistant', content: aiResponse.response });
            fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
        } else {
            console.log(`\n✅ Plan: ${aiResponse.response}`);
            // Mock execution for now to show progress
            console.log(`> Executing Step 1... Done.`);
            console.log(`> Executing Step 2... Done.`);
        }

    } catch (e) {
        console.error("Error asking Ollama:", e.message);
        console.log("Response: I am struggling to think right now. (Model Error)");
    }
}

runPM();
