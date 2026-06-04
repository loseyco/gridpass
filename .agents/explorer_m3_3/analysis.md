# GRIDPASS.APP DYNAMIC ROUTING & VERIFICATION ANALYSIS

## Executive Summary
This analysis details the Next.js static-hydration architecture of `/adventure` and `/scan` routes, maps the direct client-to-Firestore database flows, specifies the Application Default Credentials (ADC) requirements for dynamic Cloud Run serverless endpoints, and provides an actionable step-by-step local-to-live deployment verification plan backed by automated E2E testing.

---

## 1. Route Serving & Client-Server Data Flow

### A. Route Serving Strategy (Firebase Framework Integration)
Under Firebase Hosting's framework-aware Next.js integration, both routes are compiled during `npm run build` or `firebase deploy`:
* **Pre-Rendered Static Shells**: Both `/adventure` and `/scan` are client components marked with the `'use client'` directive. Since they do not require dynamic server-rendered headers or cookies, Next.js generates static HTML templates and JS client bundles at build time.
* **Hosting CDN Delivery**: When a client requests `/adventure` or `/scan`, the Firebase Hosting CDN serves the pre-rendered HTML static shell immediately.
* **Client-Side Hydration**: The React engine hydrates the HTML and activates the dynamic JavaScript bundles in the browser.

### B. E2E Test Isolation (Mocking Mechanism)
Both components implement a local mock state detection using a global window hook:
```typescript
if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) { ... }
```
* **Offline E2E Execution**: When `window.__PLAYWRIGHT_MOCK__` is set to `true` (injected automatically in `tests/gridpass.spec.ts`), the components bypass direct Firestore connections, seeding the UI state (checked-in riders, paddock pups, trip origins) fully out of local memory variables.
* **Live Connection**: If the flag is absent, both pages initiate direct real-time database listener connections to Firestore using the client Firebase Web SDK.

### C. Client-Server Data Flow: `/adventure` (Voyage Hub)
* **Real-Time Data Streaming (Read Flow)**:
  * Uses the browser-level client SDK (`firebase/firestore`) to establish real-time socket-based `onSnapshot` listeners.
  * Streams documents for:
    1. `voyage_trips` (document ID bound to `user.uid` or falling back to `'guest-trip'`).
    2. `voyage_manifests` (checked items, filtered by `userId`).
    3. `voyage_pets` (dog medical logs for Diesel & Roxy).
    4. `voyage_gates` (MX track safety disclaimer waiver text).
    5. `voyage_riders` (checked-in MX riders, sorted by creation timestamp).
    6. `voyage_checkins` (live driver checkpoint feed).
    7. `voyage_tags` (custom amenity and POI tags).
  * Automatically seeds fallback default values (using `setDoc` or `addDoc`) if no records exist in the databases on the initial load.
* **Direct Mutations (Write Flow)**:
  * User mutations directly call the client SDK (`setDoc`, `updateDoc`, `addDoc`, or `deleteDoc`).
  * Mutations bypass server intermediation, ensuring sub-second state sync across all connected clients.
  * System event logging calls `logEvent` which pushes structured event JSON directly to `system_logs` collection.

### D. Client-Server Data Flow: `/scan` (QR Scanner Portal)
* **Scan Processing (Client-Side Only)**:
  * Uses browser `navigator.mediaDevices.getUserMedia` to acquire raw camera streams.
  * Renders frames onto a hidden `HTMLCanvasElement` using a high-rate `requestAnimationFrame` loop.
  * The `jsQR` parser analyzes pixel data on each frame fully inside the browser sandbox (completely offline/client-side).
* **Metadata & Geolocation Acquisition (Flow to DB)**:
  * Once a valid Gridpass QR tag is parsed, the page requests the user's current GPS location via `navigator.geolocation.getCurrentPosition`.
  * Packages GPS coordinates (`lat`, `lng`, `accuracy`), hardware browser identifiers (`navigator.userAgent`), date/time metadata, and the clean `tagId` into a telemetry payload.
  * Performs an asynchronous write directly to the `tag_scans` collection in Firestore via `addDoc`.
  * Triggers a system log via `logEvent` writing to `system_logs`.
* **State Transition**:
  * Upon successfully writing to Firestore, it initiates client-side routing using `router.push('/join?id=<tagId>')` to load the dynamic profile claim wizard.

---

## 2. Dynamic Cloud Run Server Configuration Requirements

Dynamic Next.js pages or API endpoints (specifically billing endpoints `/api/billing/checkout` and `/api/billing/webhook`) do not run inside static hosting. Firebase Hosting automatically deploys these dynamic serverless segments to **Google Cloud Run** backend containers.

For this dynamic server to successfully execute administrative Firestore operations and Stripe flows, it requires the following configuration:

### A. Firestore IAM Credentials & Application Default Credentials (ADC)
* In `src/lib/firebase/admin.ts`, the Firebase Admin SDK is initialized using:
  ```typescript
  credential: admin.credential.applicationDefault()
  ```
* **On Google Cloud Run**: The runtime environment natively intercepts authentication. The Admin SDK communicates with Google's local Metadata Service to borrow credentials from the active service account associated with the Cloud Run service.
  * *Important Constraint*: The Cloud Run instance **does not require** a downloaded JSON key file or a base64 encoded credential string in its environment variables.
  * *Required IAM Role*: The service account under which Cloud Run is running must be granted the **`Cloud Datastore User`** (or `Firebase Admin SDK Administrator Service Agent`) IAM permission inside the Google Cloud Console.
* **On Local Development / Build Test Machines**:
  * Running dynamic server pipelines locally (e.g. testing Stripe endpoints) requires either:
    1. Authenticating the local shell using `gcloud auth application-default login`.
    2. Setting the `GOOGLE_APPLICATION_CREDENTIALS` environment variable pointing to the absolute path of a Service Account JSON private key file.

### B. Essential Server Environment Variables
The following keys must be supplied to the Cloud Run environment container variables to authorize backend executions:

| Variable Name | Purpose | Scope |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Identifies the project database to connect to (`gridpass`). | Client & Server |
| `STRIPE_SECRET_KEY` | Authenticates API communication with Stripe for payment generation (`sk_live_...` or `sk_test_...`). | Server-Only |
| `STRIPE_WEBHOOK_SECRET` | Verifies cryptographic signatures of incoming Stripe webhook notifications. | Server-Only |
| `GEMINI_API_KEY` | Key for dynamic AI response generations (windshield specs, passport details). | Server-Only |

---

## 3. Step-by-Step Local-to-Live Verification Plan

To guarantee visual, functional, and database parity between local builds and live environments, execute this unified multi-phase verification plan.

### Phase 1: Local Development Sanitization
Verify code compliance, styling standards, and clean mock execution.
1. **Port Cleanup**: Verify that port 3000 is open:
   * Windows: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force` (if port is occupied).
2. **ESLint Verification**: Ensure no static compliance syntax or style warnings:
   ```bash
   npm run lint
   ```
3. **E2E Mocked Verification**: Launch the Next.js dev server and execute offline Playwright E2E checks:
   ```bash
   node run-tests.js
   ```
   * **Verification Criteria**:
     * Dev server starts on port `3000`.
     * `window.__PLAYWRIGHT_MOCK__` is injected before page loads.
     * All 10 tests pass, confirming successful UI render of all primary routes.
     * Check that the E2E runner took responsive screenshots and successfully downloaded the high-DPI Canvas PDF.

### Phase 2: Local Production Build Hardening
Replicate production builds locally to detect compilation/hydration mismatches.
1. **Production Compilation**: Build static assets and dynamic serverless chunks:
   ```bash
   npm run build
   ```
   * **Verification Criteria**:
     * Zero compilation errors.
     * Output summary maps `/adventure` and `/scan` as static pages (`○` or `●` static-hydrate) and `/api/billing/*` as server endpoints (`λ`).
2. **Production Launch**: Spin up the local production node bundle:
   ```bash
   npm run start
   ```
3. **Production E2E Regression**: Run the E2E verification tests against the local production bundle to catch minification or chunking issues.

### Phase 3: Firebase Deployment Execution
Deploy rules, assets, and dynamic routing to Firebase Hosting & Cloud Run.
1. **Security Rules Synchronization**:
   * Deploy Firestore access bounds: `firebase deploy --only firestore:rules`
   * Deploy Storage bucket bounds: `firebase deploy --only storage:rules`
2. **Framework-Aware Hosting Deployment**:
   ```bash
   firebase deploy --only hosting
   ```
   * **Verification Criteria**:
     * Static assets uploaded to CDN buckets.
     * Serverless routing endpoints compiled and uploaded to the Google Cloud Run dynamic backend.
3. **GCP Console Integration Check**:
   * Inspect Cloud Run service dashboard for Gridpass.
   * Verify environment variables (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) are present.
   * Verify service account permission includes `Cloud Datastore User` role.

### Phase 4: Live Deployment Parity Checks (`https://gridpass.web.app`)
Perform automated and direct smoke tests on the production environment.
1. **Automated Live E2E Checks (Mock State)**:
   * Run the Playwright test suite against the live URL:
     ```bash
     npx playwright test --config=playwright.config.ts --baseUrl=https://gridpass.web.app
     ```
   * **Verification Criteria**:
     * Ensures all page assets hydrations and layout states map correctly on the live CDN under identical simulated viewport view constraints.
2. **Manual Database Write Integrity (Non-Mock State)**:
   * Open `https://gridpass.web.app/adventure` in an un-mocked browser.
   * Add a new stop checkpoint `Stopover: Starbase Basecamp ⛺` and toggle several rig manifest checkboxes.
   * **Verification Criteria**:
     * The UI shows the green confirmation sync checkmark.
     * Open Google Cloud Firestore Console, inspect collection `voyage_trips` and `voyage_manifests`. Confirm that updated documents reflect the exact client entries.
3. **Hardware Sandbox & Geolocation Validation**:
   * Access `https://gridpass.web.app/scan` using a mobile device.
   * **Verification Criteria**:
     * Verify that the browser forces an HTTPS-compliant sandbox permission request for both **Camera** and **Location**.
     * Approve requests and verify the active neon target line and camera view render smoothly.
     * Scan a sample barcode/QR code and confirm the client immediately records geographic `lat`/`lng` in the `tag_scans` collection in Firestore before routing.
4. **Dynamic API Endpoint Smoke Test**:
   * Trigger a premium upgrade request on the client to hitting `/api/billing/checkout`.
   * **Verification Criteria**:
     * Verify it returns a HTTP `200` with a valid Stripe URL and successfully redirects the user to the Stripe Checkout UI.
