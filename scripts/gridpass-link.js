const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');

// --- Configuration ---
const POLL_INTERVAL = 5000;

// --- Colors ---
const c = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    green: "\x1b[32m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m"
};

// --- Setup Supabase ---
function getSupabase() {
    let sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    // Try .env.local
    if (!sbUrl || !sbKey) {
        try {
            const envPath = path.resolve(__dirname, '../.env.local');
            console.log(c.dim + `Loading env from: ${envPath}` + c.reset);

            if (fs.existsSync(envPath)) {
                const env = fs.readFileSync(envPath, 'utf-8');
                env.split('\n').forEach(line => {
                    const [k, v] = line.split('=');
                    if (k && v) {
                        let cleanV = v.trim();
                        if ((cleanV.startsWith('"') && cleanV.endsWith('"')) || (cleanV.startsWith("'") && cleanV.endsWith("'"))) {
                            cleanV = cleanV.slice(1, -1);
                        }
                        if (k.trim() === 'NEXT_PUBLIC_SUPABASE_URL') sbUrl = cleanV;
                        if (k.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') sbKey = cleanV;
                    }
                });
            } else {
                console.error(c.red + "File not found: " + envPath + c.reset);
            }
        } catch (e) {
            console.error(c.red + "Could not read .env.local: " + e.message + c.reset);
        }
    }

    if (!sbUrl || !sbKey) {
        console.error(c.red + "❌ Missing Supabase Credentials (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)" + c.reset);
        console.error(`URL: ${sbUrl}, KEY: ${sbKey ? 'FOUND' : 'MISSING'}`);
        process.exit(1);
    }

    // Validate URL format simply
    if (!sbUrl.startsWith('http')) {
        console.error(c.red + "❌ Invalid Supabase URL: " + sbUrl + c.reset);
        process.exit(1);
    }
    return createClient(sbUrl, sbKey);
}

const supabase = getSupabase();

// --- UI Helpers ---
function clearScreen() {
    process.stdout.write('\x1Bc');
}

function drawHeader() {
    console.log(c.magenta + c.bright + "╔════════════════════════════════════════════════════════════════╗" + c.reset);
    console.log(c.magenta + c.bright + "║                   GRIDPASS LINK v2.1                           ║" + c.reset);
    console.log(c.magenta + c.bright + "║             Local AI Workforce Command Center                  ║" + c.reset);
    console.log(c.magenta + c.bright + "╚════════════════════════════════════════════════════════════════╝" + c.reset);
    console.log(c.dim + `Connects: ${supabase.supabaseUrl}` + c.reset);
    console.log(c.dim + "Status: " + c.green + "ONLINE & LISTENING..." + c.reset);
    console.log("");
}

// --- Logic ---

async function checkPMTasks() {
    const { data: tasks, error } = await supabase
        .from('pm_tasks')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) {
        console.error(c.red + "Error checking PM tasks:", error.message + c.reset);
        return;
    }

    if (tasks && tasks.length > 0) {
        for (const task of tasks) {
            await processPMTask(task);
        }
    }
}

async function processPMTask(task) {
    console.log(c.cyan + `\n[PM-TASK] New Request: "${task.request}"` + c.reset);

    // 1. Mark as processing
    await supabase.from('pm_tasks').update({ status: 'processing' }).eq('id', task.id);

    // 2. Run PM Agent
    console.log(c.yellow + "  > Launching Project Manager AI..." + c.reset);
    try {
        // Quote the request to handle spaces in shell mode
        const safeRequest = `"${task.request.replace(/"/g, '\\"')}"`;
        const output = await runScript('pm_agent.js', [safeRequest]);

        // 3. Complete
        // Extract a clean summary if possible, for now just dump stdout
        const response = output.trim();
        await supabase.from('pm_tasks').update({
            status: 'completed',
            response: response,
            updated_at: new Date().toISOString()
        }).eq('id', task.id);

        console.log(c.green + "  > Task Completed & Synced to Cloud." + c.reset);

    } catch (e) {
        console.error(c.red + "  > Task Failed: " + e.message + c.reset);
        await supabase.from('pm_tasks').update({
            status: 'failed',
            response: `Error: ${e.message}`,
            updated_at: new Date().toISOString()
        }).eq('id', task.id);
    }
}

function runScript(scriptName, args) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, scriptName);
        const child = spawn('node', [scriptPath, ...args], {
            cwd: process.cwd(),
            shell: true,
            env: { ...process.env, FORCE_COLOR: 'true' } // Keep colors
        });

        let output = '';

        child.stdout.on('data', (data) => {
            const str = data.toString();
            output += str;
            process.stdout.write(c.dim + "    | " + c.reset + str.replace(/\n/g, '\n    | ')); // Indent output
        });

        child.stderr.on('data', (data) => {
            const str = data.toString();
            process.stderr.write(c.red + "    ! " + c.reset + str);
        });

        child.on('close', (code) => {
            if (code === 0) resolve(output);
            else reject(new Error(`Script exited with code ${code}`));
        });
    });
}

// --- Main Loop ---
async function loop() {
    // clearScreen(); // Maybe too aggressive? Let's just scroll.
    // drawHeader();

    // We'll just run check continuously so logs persist.
    // drawHeader(); only once?

    // Actually, let's keep it simple.

    try {
        process.stdout.write(c.dim + "." + c.reset); // Heartbeat
        await checkPMTasks();
        // await checkFeatureTasks(); // Future
    } catch (e) {
        console.error("Loop Error:", e);
    }

    setTimeout(loop, POLL_INTERVAL);
}

// --- HTTP Server (Local HUD) ---
const http = require('http');
const os = require('os'); // Added os
const PORT = 3005;
const DASHBOARD_DIR = path.join(__dirname, '../local-ai/dashboard');

const server = http.createServer(async (req, res) => {
    // ... headers ...
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.method === 'GET') {
        if (req.url === '/api/system') {
            const used = os.totalmem() - os.freemem();
            const ram = (used / 1024 / 1024 / 1024).toFixed(1) + 'GB';
            const cpu = os.loadavg()[0].toFixed(1) + '%';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ram, cpu }));
        } else if (req.url === '/' || req.url === '/index.html') {
            // ... rest of code
            fs.readFile(path.join(DASHBOARD_DIR, 'index.html'), (err, data) => {
                if (err) { res.writeHead(404); res.end('Not Found'); return; }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            });
        } else if (req.url === '/renderer.js') {
            fs.readFile(path.join(DASHBOARD_DIR, 'renderer.js'), (err, data) => {
                if (err) { res.writeHead(404); res.end('Not Found'); return; }
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(data);
            });
        } else if (req.url === '/agent_status.json' || req.url === '/api/status') {
            // Serve the local json file
            const statusPath = path.join(__dirname, '../local-ai/agent_status.json');
            fs.readFile(statusPath, (err, data) => {
                if (err) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{}'); return; }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            });
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    } else if (req.method === 'POST' && req.url === '/api/pm') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { request } = JSON.parse(body);
                if (!request) throw new Error('No request provided');

                console.log(c.cyan + `\n[LOCAL-HUD] New Request: "${request}"` + c.reset);

                // Insert into Supabase so it's tracked globally
                const { error } = await supabase.from('pm_tasks').insert({
                    request,
                    status: 'pending'
                });

                if (error) throw error;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Queued' }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
    } else if (req.method === 'GET' && req.url === '/api/pm/history') {
        const historyPath = path.join(__dirname, '../local-ai/data/pm_chat_history.json');
        fs.readFile(historyPath, (err, data) => {
            if (err) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('[]'); return; }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
    } else if (req.method === 'GET' && req.url === '/api/tasks') {
        try {
            // Fetch Active (Processing)
            const { data: active } = await supabase
                .from('pm_tasks')
                .select('id, request, updated_at')
                .eq('status', 'processing')
                .order('updated_at', { ascending: false })
                .limit(1);



            // Fetch Queue (Pending)
            const { data: queue } = await supabase
                .from('pm_tasks')
                .select('id, request, created_at')
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .limit(5);

            // Fetch Last Completed
            const { data: completed } = await supabase
                .from('pm_tasks')
                .select('id, request, response, updated_at')
                .eq('status', 'completed')
                .order('updated_at', { ascending: false })
                .limit(1);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                active: active ? active[0] : null,
                queue: queue || [],
                lastCompleted: completed ? completed[0] : null
            }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
    }
});

server.listen(PORT, () => {
    console.log(c.dim + `Local HUD Server running at http://localhost:${PORT}` + c.reset);
});

// Start
clearScreen();
drawHeader();
loop();
