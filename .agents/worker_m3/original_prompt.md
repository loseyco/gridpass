## 2026-05-23T00:33:47Z

You are a Worker subagent tasked with executing the dynamic Firebase Hosting/SSR Cloud Run deployment and security rules synchronization for gridpass.app.

### MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### Execution Steps
1. **Clean build caches**: Delete the `.next/` and `.firebase/` folders to clear any stale TypeScript compilation states.
2. **Framework compilation**: Verify that the Next.js framework compiles perfectly without TypeScript or ESLint errors by running:
   `npm run build`
   and
   `npm run lint`
3. **Web Frameworks configuration**: Run:
   `firebase experiments:enable webframeworks`
4. **Firebase Dynamic Deployment**: Execute:
   `firebase deploy`
   to compile static assets, upload dynamic Cloud Run SSR Serverless functions, and synchronize `firestore.rules` and `storage.rules` with the live production environment.
5. **Local Integrity E2E Verification**: Ensure the local development server (or local production build using `npm run start`) is running in the background, and verify the integrity of the application using Playwright:
   `npx playwright test`
   Confirm that all 10 tests pass cleanly.

Write your completion report detailing commands run and their exact console outputs to `c:\_Projects\Gridpass-v4\.agents\worker_m3\report.md`. When complete, notify the main agent via send_message.
