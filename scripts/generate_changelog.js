const fs = require('fs');
const path = require('path');

// Configuration
const EXPERT_PATH = path.join(__dirname, '../local-ai/experts/changelog.md');
const HISTORY_PATH = path.join(__dirname, '../local-ai/reports/changelog_history.json');
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'llama3';

// Load AI Manager
let aiManager;
try {
    aiManager = require('../local-ai/ai-manager');
} catch (e) {
    aiManager = { updateStatus: (s, n, m) => console.log(`[${s}] ${n}: ${m}`), ensureHud: () => { } };
}

// Input: "Added SEO Agent, Fixed Login"
const inputChanges = process.argv[2];

if (!inputChanges) {
    console.error('❌ Usage: node scripts/generate_changelog.js "<list of changes>"');
    process.exit(1);
}

async function generateChangelog() {
    aiManager.ensureHud();
    aiManager.updateStatus('thinking', 'Changelog Agent', 'Drafting patch notes...');

    // 1. Load Context
    const persona = fs.readFileSync(EXPERT_PATH, 'utf8');

    // 2. Load History for versioning
    let history = [];
    if (fs.existsSync(HISTORY_PATH)) {
        history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
    }

    // Simple version bump logic
    const lastVersion = history.length > 0 ? history[0].version : 'v0.0.5';
    const versionParts = lastVersion.replace('v', '').split('.').map(Number);

    // Alpha Versioning: Keep major/minor at 0.1, bump patch
    versionParts[1] = 1;
    versionParts[2]++;

    const nextVersion = `v${versionParts.join('.')}`;

    const prompt = `
${persona}

TASK:
Based on the following raw update notes, generate a new Changelog Entry for version **${nextVersion}**.
Raw Notes: "${inputChanges}"

Return ONLY the JSON object for this single entry. Do not wrap in markdown code blocks.
`;

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                prompt: prompt,
                stream: false,
                format: 'json',
                options: { temperature: 0.4 }
            })
        });

        const data = await response.json();
        const entry = JSON.parse(data.response);

        // Ensure date is today
        entry.date = new Date().toISOString().split('T')[0];
        entry.version = nextVersion;

        // Prepend to history
        history.unshift(entry);

        // Save
        if (!fs.existsSync(path.dirname(HISTORY_PATH))) {
            fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
        }
        fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));

        console.log(`✅ Changelog updated: ${entry.title} (${entry.version})`);
        aiManager.updateStatus('success', 'Changelog Agent', `Published ${entry.version}`);

    } catch (e) {
        console.error('🔥 Changelog Failure:', e.message);
        aiManager.updateStatus('error', 'Changelog Agent', e.message);
    }
}

generateChangelog();
