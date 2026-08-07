import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Single worker for smooth visual step-by-step execution
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    headless: false, // MANDATORY INVARIANT: Always open visual Chrome browser window on desktop
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    channel: 'chrome', // Use user's installed Google Chrome browser
    // Preserve local authentication session state
    storageState: path.join(__dirname, 'tests', '.auth', 'user.json'),
    launchOptions: {
      headless: false,
      args: [
        '--start-maximized',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
      ],
    },
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
