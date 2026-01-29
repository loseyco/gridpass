const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, exec } = require('child_process');

// Config
const STATUS_FILE = path.join(__dirname, '../local-ai/agent_status.json');
const PLAN_FILE = path.join(__dirname, '../repair_plan.sql');

let ollamaStatus = '🔴 OFFLINE';
let agentProcess = null;

let gpuStatus = 'Checking...';

// Helper: Format Bytes
const formatBytes = (bytes) => (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';

// Helper: Check Ollama
async function checkOllama() {
    try {
        const res = await fetch('http://localhost:11434/api/tags');
        if (res.ok) {
            const data = await res.json();
            const modelCount = data.models ? data.models.length : 0;
            ollamaStatus = `🟢 ONLINE (${modelCount} models loaded)`;
        } else {
            ollamaStatus = '🔴 ERROR';
        }
    } catch (e) {
        ollamaStatus = '🔴 UNREACHABLE';
    }
}

// Helper: Get GPU
function checkGpu() {
    exec('nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits', (err, stdout) => {
        if (!err && stdout) {
            const [util, used, total] = stdout.trim().split(', ');
            gpuStatus = `Load: ${util}% | VRAM: ${used}MB / ${total}MB`;
        } else {
            gpuStatus = 'N/A';
        }
    });
}
// Run GPU check frequently
setInterval(checkGpu, 2000);

// Helper: Format Time Duration
function getDuration(startTime) {
    if (!startTime) return '0s';
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 1000);
    return `${diff}s`;
}

// Draw Screen
function draw() {
    console.clear();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const timestamp = new Date().toLocaleTimeString();

    // Read Agent Status
    let agent = { state: 'OFFLINE', stage: '-', log: '-', updatedAt: null };
    try {
        if (fs.existsSync(STATUS_FILE)) {
            agent = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
        }
    } catch (e) { }

    // Check Plan
    const hasPlan = fs.existsSync(PLAN_FILE);

    console.log(`
============================================================
   GRIDPASS LOCAL AI - COMMAND CENTER        [${timestamp}]
============================================================

[ HOST RESOURCES ]
  CPU: ${os.loadavg()[0].toFixed(1)}% Load
  RAM: ${formatBytes(usedMem)} / ${formatBytes(totalMem)}
  GPU: ${gpuStatus} (NPU Active)

[ AI ENGINE ]
  Status: ${ollamaStatus}

[ ACTIVE AGENT: REPAIR BOT ]
  State:  ${agent.state === 'active' ? '🟢 ACTIVE' : '⚪ IDLE'}
  Stage:  ${agent.stage}
  Time:   ${getDuration(agent.updatedAt)} elapsed
  Target: ${agent.target || 'None'}
  
  > ${agent.log}

  ${hasPlan ? '🚨 ALERT: REPAIR PLAN READY! (Run "type repair_plan.sql")' : ''}

[ CONTROLS ]
  (r) Run Repair Sweep    (c) Clear Plan    (q) Quit
============================================================
${agentProcess ? '>> Agent Running...' : '>> Ready.'}
    `);
}

// Input Handling
const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
    if (key.name === 'q') {
        process.exit();
    }
    if (key.name === 'r') {
        if (agentProcess) return;
        agentProcess = spawn('node', ['scripts/auto_heal_api.js'], { stdio: 'inherit', shell: true });
        agentProcess.on('close', () => {
            agentProcess = null;
        });
    }
    if (key.name === 'c') {
        if (fs.existsSync(PLAN_FILE)) fs.unlinkSync(PLAN_FILE);
    }
});

// Main Loop
setInterval(async () => {
    if (!agentProcess) { // Don't redraw if agent is spamming stdout
        await checkOllama();
        draw();
    }
}, 1000);

checkOllama().then(draw);
