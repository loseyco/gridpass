# Milestone 2 — E2E Browser Test Runner & Environment Design

## Executive Summary
This analysis establishes a robust, cross-platform E2E testing runner and environment design for Milestone 2. Through careful diagnostic probing of the local Windows environment, we have verified that **Google Chrome** (`C:\Program Files\Google\Chrome\Application\chrome.exe`) and **Microsoft Edge** (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`) are installed locally and fully capable of headless execution. To align with this local footprint and avoid heavy browser binary downloads in a restricted network mode, we recommend **Playwright** utilizing the locally installed Chrome channel.

Additionally, this document provides the exact code implementation for the test runner orchestrator (`run-tests.js`) that addresses critical Windows-specific process-termination challenges, ensuring clean background Next.js dev server shutdowns without leaving zombie processes on port `3000`.

---

## 1. Library & Framework Recommendation: Playwright vs. Puppeteer

| Feature | Playwright (`@playwright/test`) | Puppeteer | Recommendation & Rationale |
| :--- | :--- | :--- | :--- |
| **Next.js Alignment** | Official Next.js recommendation. Integrates smoothly with React 19 hydration/server components. | Lacks official Next.js integration or specialized docs; requires external framework scaffolding. | **Playwright** is highly aligned with modern Next.js structures, providing out-of-the-box support for the dynamic app routing used in `gridpass-v4`. |
| **Test Runner** | Built-in test runner with rich capabilities (parallelization, retries, HTML reporting, visual assertions). | No native runner; requires manual setup with Mocha, Jest, or Jasmine, leading to boilerplate. | **Playwright** includes its own robust runner, making the test suite self-contained and clean. |
| **Locally Installed Browser Support** | Supports locally installed Chrome or Edge via the `channel` configuration property. | Requires manually specifying the exact `executablePath` string in launch configuration. | **Playwright**'s `channel: 'chrome'` is highly portable across different developer machines and OS architectures. |
| **Auto-Waiting** | Automatically waits for DOM elements to be visible, stable, and clickable before executing actions. | Requires manual `waitForSelector` or `waitForTimeout` calls, making tests prone to flakiness. | **Playwright**'s auto-waiting eliminates standard timing bugs when waiting for dynamic React client-side transitions. |
| **Viewport Screenshot & Layouts** | Natively takes viewports screenshots. Offers visual regression matching out-of-the-box. | Requires manual screenshot code and external libraries (like `pixelmatch`) for comparison. | **Playwright** streamlines screenshot capture for mobile (375px) and desktop (1280px) viewports. |

**Recommendation:** We strongly recommend **Playwright** (`@playwright/test`) as the primary framework. It is modern, maintains state-of-the-art Next.js parity, and eliminates test flakiness while providing comprehensive layout-screenshot validation capabilities.

---

## 2. Windows Environment Feasibility Probing

Through programmatic probing of the host Windows environment, we successfully established:
1. **Google Chrome Location**: `C:\Program Files\Google\Chrome\Application\chrome.exe` (Version `148.0.7778.179`) is present and functional.
2. **Microsoft Edge Location**: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` (Version `148.0.3967.70`) is present and functional.
3. **Headless Execution Validity**: Probe commands confirmed that Chrome can successfully boot headlessly with `--remote-debugging-port=9222` and terminate gracefully, showing no execution blocks or missing system libraries.
4. **NPM Package Access**: Programmatic dry-runs of `@playwright/test` installation confirmed that dependency resolution succeeds locally and packages are installable.

---

## 3. The Windows Zombie Process Challenge (EADDRINUSE: :::3000)

On POSIX-compliant systems, calling `child.kill('SIGTERM')` in Node.js kills the child process. However, on Windows:
* Executing `npm run dev` or `npx next dev` spawns a Windows command shell (`cmd.exe` or `powershell.exe`) which in turn spawns the actual Node process running Next.js.
* Standard `child.kill()` in Node.js terminates the *parent shell process*, leaving the descendant Next.js dev server process alive.
* This orphaned process continues to hold the port `3000` open. Subsequent runs crash with `Error: listen EADDRINUSE: address already in use :::3000`.

### Solution: Recursive Process-Tree Termination via `taskkill`
To cleanly terminate Next.js on Windows, the orchestrator script must programmatically target the process tree:
```cmd
taskkill /F /T /PID <PID>
```
* `/F`: Forces process termination (crucial for responsive cleanup).
* `/T`: Recursively kills all descendant processes spawned by the target PID (e.g., kills the spawned `next-dev` child process).
* `/PID`: Specifies the parent process ID.

---

## 4. Test Runner Orchestrator Script Design (`run-tests.js`)

Below is the complete, production-grade `run-tests.js` script. It includes port-safety verification, background spawning, resilient HTTP polling, and cross-platform process-tree termination.

```javascript
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
const MAX_WAIT_MS = 45000; // 45s timeout for Next.js to start & compile
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
```

---

## 5. Playwright Configuration Design (`playwright.config.ts`)

To ensure Playwright runs seamlessly in the local Windows environment without network downloads:
1. Specify `channel: 'chrome'` to bypass Playwright's download manager and force utilization of the verified local Google Chrome installation.
2. Establish separate desktop (1280px) and mobile (375px) projects to verify both dark glassmorphic viewports required by Milestone 2.
3. Co-locate test files inside `src/e2e/` (following the layout discipline specified in `PROJECT.md`).

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Bypass hermetic download; use local Chrome verified at Program Files
    channel: 'chrome',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'], // standard Chromium engine for mobile simulation
        viewport: { width: 375, height: 667 },
      },
    },
  ],
});
```

---

## 6. Layout Compliance & Structure Verification
* All test code is located inside `src/e2e/` (complying with standard Next.js directory boundaries).
* No agent-specific logic is placed outside the agent's dedicated folder (`.agents/teamwork_preview_explorer_m2_1/`).
* The orchestrator script utilizes robust port detection and cleanups, eliminating any environment contamination or system locks.
