const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TRAINER_CONTEXT_PATH = path.join(__dirname, '../local-ai/experts/trainer.md');
const HISTORY_PATH = path.join(__dirname, '../local-ai/data/training_history.json');
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'llama3';

let aiManager;
try {
    aiManager = require('../local-ai/ai-manager');
} catch (e) {
    aiManager = { updateStatus: (s, n, m) => console.log(`[${s}] ${n}: ${m}`), ensureHud: () => { } };
}

// Mode Selection
const mode = process.argv[2];

async function main() {
    aiManager.ensureHud();

    if (mode === '--learn') {
        await runOnlineLearning();
    } else {
        await runStandardTraining();
    }
}

async function runOnlineLearning() {
    const url = process.argv[3];
    const targetExpert = process.argv[4] || 'trainer';

    if (!url) {
        console.error('❌ Usage: node scripts/train_expert.js --learn <url> [target_expert]');
        process.exit(1);
    }

    aiManager.updateStatus('active', 'Trainer AI', `Browsing: ${url}`);
    console.log(`🌐 Trainer visiting: ${url}`);

    try {
        // 1. Fetch Content
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();

        // 2. Synthesize via Gemini (Cloud Brain)
        aiManager.updateStatus('thinking', 'Trainer AI', 'Synthesizing knowledge...');
        console.log(`🧠 Synthesizing via Cloud Expert...`);

        // Truncate to avoid shell limits (simple heuristic)
        const contentSnippet = html.substring(0, 15000).replace(/"/g, '\\"');

        const prompt = `
            Analyze this HTML documentation snippet and extract 3-5 high-value, actionable rules for a coding agent.
            Format as markdown bullet points. Focus on best practices, syntax nuances, or architectural patterns found in the text.
            
            Content:
            ${contentSnippet}
        `;

        const cmd = `node scripts/gemini_client.js "${prompt}"`;
        const newKnowledge = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });

        // 3. Save to Expert
        saveKnowledge(targetExpert, newKnowledge, url);
        logSession('online_learning', targetExpert, 'SUCCESS', `Learned from ${url}`);

    } catch (e) {
        console.error('🔥 Online Learning Failed:', e.message);
        aiManager.updateStatus('error', 'Trainer AI', e.message);
        logSession('online_learning', targetExpert, 'FAILURE', e.message);
    }
}

async function runStandardTraining() {
    const expertName = process.argv[2];
    const outcome = process.argv[3];
    const logContent = process.argv[4];

    if (!expertName || !outcome) {
        console.error('❌ Usage: node scripts/train_expert.js <expert_name> <outcome> "<log>"');
        process.exit(1);
    }

    aiManager.updateStatus('thinking', 'Trainer AI', `Analyzing ${expertName}...`);

    // Standard Ollama Logic
    if (!fs.existsSync(TRAINER_CONTEXT_PATH)) return;
    const trainerContext = fs.readFileSync(TRAINER_CONTEXT_PATH, 'utf8');

    const prompt = `
${trainerContext}

TASK:
Analyze performance and generate a new Rule for "${expertName}".
Outcome: ${outcome}
Context: "${logContent}"

Return ONLY the rule text.
    `;

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                prompt: prompt,
                stream: false,
                options: { temperature: 0.4 }
            })
        });

        const data = await response.json();
        const newRule = data.response.trim();

        if (newRule) {
            console.log(`💡 New Rule: ${newRule}`);
            saveKnowledge(expertName, newRule, 'Self-Reflection');
            logSession('standard_training', expertName, 'SUCCESS', 'New rule generated');
            aiManager.updateStatus('success', 'Trainer AI', 'Knowledge updated.');
        } else {
            logSession('standard_training', expertName, 'SKIPPED', 'No rule generated');
        }

    } catch (e) {
        console.error('Training Error:', e.message);
        logSession('standard_training', expertName, 'FAILURE', e.message);
        aiManager.updateStatus('error', 'Trainer AI', e.message);
    }
}

function saveKnowledge(expertName, rule, source) {
    const expertFile = path.join(__dirname, `../local-ai/experts/${expertName}.md`);
    if (fs.existsSync(expertFile)) {
        let content = fs.readFileSync(expertFile, 'utf8');
        if (!content.includes('## Learned Lessons')) content += '\n\n## Learned Lessons\n';

        const timestamp = new Date().toISOString().split('T')[0];
        content += `\n- [${timestamp}] (${source}): ${rule}`;

        fs.writeFileSync(expertFile, content);
        console.log(`✅ Updated ${expertName}.md`);
    }
}

function logSession(type, target, status, details) {
    let history = { sessions: [] };
    if (fs.existsSync(HISTORY_PATH)) {
        try { history = JSON.parse(fs.readFileSync(HISTORY_PATH)); } catch (e) { }
    }

    history.sessions.unshift({
        id: Date.now(),
        type,
        target,
        status,
        details,
        timestamp: new Date().toISOString()
    });

    // Keep last 50
    history.sessions = history.sessions.slice(0, 50);
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}

main();
