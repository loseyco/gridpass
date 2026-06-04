## 2026-05-22T19:41:00-05:00
You are a Worker subagent tasked with securing and updating the Firebase security rules, API endpoints, and executing a verified production deployment for gridpass.app.

### MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### Context & Tasks
Two independent reviewers have evaluated the previous deployment and identified critical security vulnerabilities and missing database rules that must be resolved. Your goal is to apply production-grade security hardening and successfully deploy to Firebase.

1. **Harden Firestore Security Rules (`c:\_Projects\Gridpass-v4\firestore.rules`)**:
   - Add explicit matching rules for the three missing collections currently active on the client: `voyage_checkins`, `voyage_tags`, and `service_logs`. 
     * `voyage_checkins` and `voyage_tags`: Allow read/write for authenticated users (`allow read, write: if request.auth != null;`).
     * `service_logs`: Allow public read (`allow read: if true;`), allow create for authenticated users (`allow create: if request.auth != null;`), and restrict update/delete to the logging user (`resource.data.recorded_by == request.auth.token.email`) or super-admin (`request.auth.token.email == 'loseyp@gmail.com'`).
   - Secure the wide-open `voyage_*` collections (`voyage_trips`, `voyage_manifests`, `voyage_pets`, `voyage_gates`, `voyage_riders`, `voyage_pitches`, `voyage_claims`, `voyage_tickets`). Change `allow read, write: if true;` to `allow read, write: if request.auth != null;`.
   - Enforce document ownership validation on vehicle and business creation: assert that the client-submitted `owner_id` matches the authenticated creator's UID (`request.resource.data.owner_id == request.auth.uid`).
   - Resolve the views count update runtime error: check for undefined views count on newly created documents by using `request.resource.data.views == resource.data.get('views', 0) + 1` instead of `resource.data.views + 1`.

2. **Harden Storage Security Rules (`c:\_Projects\Gridpass-v4\storage.rules`)**:
   - Implement path-isolated authorization to prevent tenants from deleting or overwriting each other's files.
   - Enforce path-based validation for user avatars:
     `match /users/{userId}/avatar.png { allow read: if true; allow write: if request.auth != null && request.auth.uid == userId; }`
   - Enforce path-based validation for vehicle showcase pictures:
     `match /vehicles/{userId}/{vehicleId}/{fileName} { allow read: if true; allow write: if request.auth != null && request.auth.uid == userId; }`
   - Secure private user directories:
     `match /private/users/{userId}/{allPaths=**} { allow read, write: if request.auth != null && request.auth.uid == userId; }`

3. **Secure Stripe Webhook Route (`c:\_Projects\Gridpass-v4\src\app\api\billing\webhook\route.ts`)**:
   - Enforce signature checks strictly in production. Ensure that if `process.env.NODE_ENV === 'production'` is true, the signature check fails shut if either the signature header (`sig`) or webhook secret (`endpointSecret`) is missing or invalid. Do not allow direct JSON parsing fallback in production!

4. **Secure Growth Autopilot Cron Route (`c:\_Projects\Gridpass-v4\src\app\api\cron\growth-engine\route.ts`)**:
   - Secure this public `GET` route by requiring an Authorization Bearer token matching a `CRON_SECRET` environment variable or verifying authorization headers.

5. **Clean & Validate Locally**:
   - Clear Next.js and Firebase caches (`.next/`, `.firebase/` folders).
   - Verify local compilation succeeds without errors: run `npm run build` and `npm run lint`.
   - Ensure the local E2E test suite runs cleanly: `npx playwright test` (or `node run-tests.js` if available).

6. **Firebase Dynamic Production Deployment**:
   - Enable webframeworks: `firebase experiments:enable webframeworks`.
   - Execute production deployment: `firebase deploy` to compile static assets, upload dynamic Cloud Run serverless dynamic rendering server, and synchronize the hardened security rules.

7. **Deliver Handoff**:
   - Write your detailed completion report to `c:\_Projects\Gridpass-v4\.agents\worker_m3_retry1\report.md`. List all modified file paths, exact code changes, and console outputs of builds, tests, and Firebase deployment. Notify the main agent when complete.
