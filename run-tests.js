/**
 * run-tests.js
 * Robust cross-platform E2E Test Runner Orchestrator.
 * Spawns the next dev server, waits for responsiveness, runs tests, and ensures process tree cleanup.
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DEV_SERVER_URL = `http://localhost:${PORT}`;
const MAX_WAIT_MS = 30000; // 30s timeout as requested by instructions
const INTERVAL_MS = 500;   // Poll every 500ms

let devServerProcess = null;

// Helper: Check if port 3000 is occupied
function checkPortInUse(port) {
  return new Promise((resolve) => {
    const server = http.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

// Helper: HTTP polling until the dev server responds
function waitUrlResponsive(url, timeoutMs, intervalMs) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Timeout: Dev server at ${url} did not respond within ${timeoutMs}ms.`));
        return;
      }

      http.get(url, (res) => {
        console.log(`[Orchestrator] Dev server is responsive (Status: ${res.statusCode}).`);
        resolve();
      }).on('error', (err) => {
        setTimeout(check, intervalMs);
      });
    };
    check();
  });
}

// Helper: Recursive process-tree cleanup
function killProcessTree(proc) {
  if (!proc) return;
  const pid = proc.pid;
  console.log(`[Orchestrator] Terminating process tree for PID ${pid}...`);

  if (process.platform === 'win32') {
    try {
      // Force kill (/F) the process tree (/T) targeting the PID (/PID)
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
      console.log(`[Orchestrator] Successfully killed Windows process tree for PID ${pid}.`);
    } catch (err) {
      console.error(`[Orchestrator] Failed to taskkill PID ${pid}:`, err.message);
    }
  } else {
    try {
      // Send SIGKILL to the process group (negative PID)
      process.kill(-pid, 'SIGKILL');
      console.log(`[Orchestrator] Successfully sent SIGKILL to process group -${pid}.`);
    } catch (err) {
      try {
        proc.kill('SIGKILL');
        console.log(`[Orchestrator] Successfully sent SIGKILL to PID ${pid}.`);
      } catch (e) {
        console.error(`[Orchestrator] Failed to kill PID ${pid}:`, e.message);
      }
    }
  }
}

async function run() {
  console.log('[Orchestrator] Starting E2E Test Orchestrator...');

  // 1. Port Collision Guard
  const inUse = await checkPortInUse(PORT);
  if (inUse) {
    console.error(`[Orchestrator] Error: Port ${PORT} is already in use.`);
    if (process.platform === 'win32') {
      try {
        // Probe netstat to show the developer exactly which process is locking port 3000
        const netstatOutput = execSync(`netstat -ano | findstr :${PORT}`).toString().trim();
        console.error(`[Orchestrator] Netstat output:\n${netstatOutput}`);
        console.error(`[Orchestrator] Free the port: taskkill /F /PID <PID_FROM_NETSTAT>`);
      } catch (netstatErr) {}
    }
    process.exit(1);
  }

  // 2. Spawn Next.js Dev Server
  console.log(`[Orchestrator] Spawning dev server: npm run dev`);
  devServerProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve(process.cwd()),
    shell: true,
    detached: process.platform !== 'win32', // Spawn in separate process group on POSIX
    stdio: 'pipe'
  });

  // Prefix output to separate Next.js logs from runner logs
  devServerProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.log(`[NextJS] ${line}`);
    });
  });

  devServerProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.error(`[NextJS-Err] ${line}`);
    });
  });

  devServerProcess.on('error', (err) => {
    console.error('[Orchestrator] Failed to launch dev server:', err);
    cleanupAndExit(1);
  });

  devServerProcess.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`[Orchestrator] Dev server exited unexpectedly with code ${code}.`);
      cleanupAndExit(1);
    }
  });

  // 3. Poll for Responsiveness
  console.log(`[Orchestrator] Waiting for dev server to become responsive at ${DEV_SERVER_URL}...`);
  try {
    await waitUrlResponsive(DEV_SERVER_URL, MAX_WAIT_MS, INTERVAL_MS);
  } catch (err) {
    console.error(`[Orchestrator] ${err.message}`);
    cleanupAndExit(1);
  }

  // 4. Run E2E Test Suite
  console.log('[Orchestrator] Server responsive. Initiating Playwright E2E tests...');
  const testProcess = spawn('npx', ['playwright', 'test'], {
    cwd: path.resolve(process.cwd()),
    shell: true,
    stdio: 'inherit'
  });

  testProcess.on('exit', (code) => {
    console.log(`[Orchestrator] E2E tests completed. Exit Code: ${code}`);
    cleanupAndExit(code);
  });

  testProcess.on('error', (err) => {
    console.error('[Orchestrator] Failed to execute Playwright tests:', err);
    cleanupAndExit(1);
  });
}

function cleanupAndExit(exitCode) {
  if (devServerProcess) {
    killProcessTree(devServerProcess);
    devServerProcess = null;
  }
  console.log(`[Orchestrator] Execution finished. Exiting with code ${exitCode}.`);
  process.exit(exitCode);
}

// 5. Active Signal & Lifetime Listeners to Prevent Zombie Processes
const signals = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT'];
signals.forEach((sig) => {
  process.on(sig, () => {
    console.log(`\n[Orchestrator] Received signal ${sig}. Terminating background processes...`);
    cleanupAndExit(130);
  });
});

process.on('uncaughtException', (err) => {
  console.error('[Orchestrator] Uncaught Exception:', err);
  cleanupAndExit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Orchestrator] Unhandled Promise Rejection:', reason);
  cleanupAndExit(1);
});

run();
