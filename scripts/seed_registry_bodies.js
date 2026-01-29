const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Config
const OLLAMA_API = 'http://localhost:11434/api/generate';
const REGISTRY_FILE = path.join(__dirname, '../register_api_master_list.json'); // Fallback if no DB access
const STATUS_FILE = path.join(__dirname, '../local-ai/agent_status.json');

// We need to query the database to find missing bodies.
// Since we can't easily do that from Node without pg driver, we'll assume we iterate over the *Failures* list 
// or the master list and check if we have a body logic.
// Simpler: Read the 'repair_plan.sql' to see what failed? No.
// Let's rely on the `verify_api_master_list.js` output which lists failures.
// Actually, let's just use the `failures` list from the `auto_heal` logic (we'll replicate the scan).

const BASE_PATH = path.join(__dirname, '../src/app');

// Tools to communicate with Antigravity (via console for now)
function log(msg) { console.log(msg); }

async function scanForFailures() {
    // We will scan the file system for route.ts files
    // and just generate bodies for ALL of them. 
    // It's cheap (Local AI).
    const files = [];

    function walk(dir) {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filepath = path.join(dir, file);
            const stat = fs.statSync(filepath);
            if (stat && stat.isDirectory()) {
                walk(filepath);
            } else if (file === 'route.ts') {
                files.push(filepath);
            }
        });
    }

    walk(BASE_PATH);
    return files;
}

async function askLocalAI(sourceCode) {
    const expertPrompt = fs.readFileSync(path.join(__dirname, '../local-ai/experts/schema_extractor.md'), 'utf-8');

    const prompt = `
${expertPrompt}

# Source Code
\`\`\`typescript
${sourceCode.substring(0, 2000)}
\`\`\`
`;

    try {
        const res = await fetch(OLLAMA_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3:latest',
                prompt: prompt,
                format: "json", // Force JSON
                stream: false
            })
        });

        const data = await res.json();
        return JSON.parse(data.response);
    } catch (e) {
        return {};
    }
}

async function run() {
    log("👷 Starting Data Entry Agent...");

    const allRoutes = await scanForFailures();
    log(`📂 Found ${allRoutes.length} routes to index.`);

    const sqlFile = path.join(__dirname, '../local-ai/seed_bodies.sql');
    fs.writeFileSync(sqlFile, '-- Generated Default Bodies\n');

    let count = 0;
    for (const file of allRoutes) {
        const relativePath = file.split('src\\app')[1].replace(/\\/g, '/').replace('/route.ts', '');

        // Simple filter: skip if we already have it? 
        // No, let's overwrite to ensure correctness.

        const source = fs.readFileSync(file, 'utf-8');
        if (!source.includes('request.json') && !source.includes('req.json')) {
            // No body needed
            continue;
        }

        process.stdout.write(`👉 Processing ${relativePath}... `);

        const body = await askLocalAI(source);

        if (Object.keys(body).length > 0) {
            console.log("✅ JSON Generated");
            const query = `UPDATE sys_api_registry SET default_body = '${JSON.stringify(body)}'::jsonb WHERE path = '${relativePath}' AND method = 'POST';`;
            fs.appendFileSync(sqlFile, query + '\n');
            count++;
        } else {
            console.log("⏩ Skipped (Empty)");
        }
    }

    log(`\n🎉 Job Done. Generated ${count} input schemas in 'local-ai/seed_bodies.sql'.`);
    log("👉 Ask Antigravity to apply this SQL file.");
}

run();
