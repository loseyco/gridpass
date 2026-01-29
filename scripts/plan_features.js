const fs = require('fs');
const path = require('path');

async function run() {
    console.log("🧠 Product Planner: Analyzing Task List...");

    // 1. Read Task.md
    // We'll read from correct path or relative. Assuming standard path.
    // Hardcoded for ease here, or pass as arg.
    const taskPath = path.join(__dirname, '../../.gemini/antigravity/brain/75c110fc-5661-43ba-b786-6baa4d0db451/task.md');
    // If not found, try a default or fail gracefully.
    if (!fs.existsSync(taskPath)) {
        console.log("Task.md not found at " + taskPath);
        // Fallback: Use some seed data directly.
    }

    // 2. Login
    const cookie = await login();

    // 3. Define Roadmap Items (Derived from Task.md knowledge)
    // I am hardcoding the extraction logic for this script to "bootstrap" the AI.
    // In a full implementation, I'd parse the markdown.
    // 3. Load Brainstormed Features
    const jsonPath = path.join(__dirname, '../local-ai/feature_brainstorm.json');
    let brainstorm = [];
    if (fs.existsSync(jsonPath)) {
        console.log("🧠 Loading Brainstormed Features...");
        brainstorm = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }

    const features = [
        ...brainstorm,
        {
            title: "Founder Pack Landing Page",
            description: "Dedicated landing page for founding members with legal disclaimer and value prop.",
            status: "completed",
            priority: "critical",
            tier: "founder",
            category: "Growth",
            votes: 50,
            estimated_hours: 8,
            assigned_expert: "frontend"
        },
        {
            title: "Global Track Database",
            description: "Comprehensive database of race tracks with geolocation and layouts.",
            status: "completed",
            priority: "high",
            tier: "core",
            category: "Racing Ops",
            votes: 25,
            estimated_hours: 20,
            assigned_expert: "racing_logic"
        },
        // ... (Keep automation item)
        {
            title: "Feature Planning System",
            description: "Internal tool for AI to plan and track features (Self-Referential).",
            status: "in_progress",
            priority: "high",
            tier: "founder",
            category: "Internal Tools",
            votes: 10,
            estimated_hours: 4,
            assigned_expert: "planner"
        }
    ];

    console.log(`📋 Found ${features.length} Features to sync.`);

    // 4. Sync with DB
    for (const feat of features) {
        console.log(`Syncing: ${feat.title}...`);
        try {
            const res = await fetch('http://localhost:3003/api/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
                body: JSON.stringify(feat)
            });
            if (res.status === 201) console.log("✅ Created");
            else if (res.status === 500 || res.status === 409) console.log("⚠️ Exists/Error " + res.status);
            else console.log("❌ Failed " + res.status);
        } catch (e) {
            console.log("❌ Error " + e.message);
        }
    }
}

async function login() {
    const res = await fetch('http://localhost:3003/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pjlosey@outlook.com', password: '!Google1!' })
    });
    await res.text();
    return res.headers.get('set-cookie');
}

run();
