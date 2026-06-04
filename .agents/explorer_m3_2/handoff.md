# Handoff Report — Security Rules and Assets Deployment Process

**Author:** Explorer Subagent `explorer_m3_2`  
**Date:** May 22, 2026  
**Status:** Complete  

---

## 1. Observation

We directly observed files and structures in the `c:\_Projects\Gridpass-v4\` workspace:

- **Security Rules Files:**
  - `firestore.rules` exists at the root of `Gridpass-v4` (length: 78 lines).
    - Hardcoded Super-Admin check: `request.auth.token.email == 'loseyp@gmail.com'` (found in lines 8, 14, 20, 26, 35, 45, 54, 56).
    - Open Sandbox Rules (lines 60-67):
      ```javascript
      match /voyage_trips/{id} { allow read, write: if true; }
      match /voyage_manifests/{id} { allow read, write: if true; }
      match /voyage_pets/{id} { allow read, write: if true; }
      match /voyage_gates/{id} { allow read, write: if true; }
      match /voyage_riders/{id} { allow read, write: if true; }
      match /voyage_pitches/{id} { allow read, write: if true; }
      match /voyage_claims/{id} { allow read, write: if true; }
      match /voyage_tickets/{id} { allow read, write: if true; }
      ```
    - View Count override logic (lines 70-75):
      ```javascript
      match /{collection}/{document} {
        allow update: if 
          (collection == 'users' || collection == 'vehicles' || collection == 'businesses') &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['views']) &&
          request.resource.data.views == resource.data.views + 1;
      }
      ```
  - `storage.rules` exists at the root of `Gridpass-v4` (length: 13 lines).
    - Bucket-wide rules:
      ```javascript
      match /{allPaths=**} {
        allow read: if true;
        allow write: if request.auth != null;
      }
      ```
  - `c:\_Projects\gridpass-v3\firestore.rules` had a catch-all block at lines 36-39:
    ```javascript
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    ```
    This was completely removed in `c:\_Projects\Gridpass-v4\firestore.rules`.

- **Deployment Mapping (`firebase.json`):**
  - Mapped targets:
    ```json
    {
      "firestore": {
        "rules": "firestore.rules"
      },
      "storage": {
        "rules": "storage.rules"
      },
      "hosting": {
        "source": ".",
        ...
      }
    }
    ```

- **Compilation Errors (`firebase-debug.log`):**
  - Excerpt from deployment logs showing compilation blockage:
    ```text
    [info] Failed to type check.
    [info] ./src/app/dash/page.tsx:290:52
    Type error: Object literal may only specify known properties, and 'accuracy' does not exist in type '{ lat: number; lng: number; }'.
    [info] > 290 |           location: { lat: 42.3601, lng: -71.0589, accuracy: 10 }
    [info] Next.js build worker exited with code: 1
    [debug] Error: ENOENT: no such file or directory, open 'C:\_Projects\Gridpass-v4\.next\export-marker.json'
    ```

- **Interface Types (`src/app/dash/page.tsx`):**
  - Interface definition at line 91:
    ```typescript
    location?: { lat: number; lng: number } | null;
    ```
  - Offending value injection in mock telemetry state at lines 288-291:
    ```typescript
    scannedAt: '2026-05-22T20:15:30Z',
    userAgent: 'Mozilla/5.0...',
    location: { lat: 42.3601, lng: -71.0589, accuracy: 10 }
    ```

---

## 2. Logic Chain

1. **Rule Comparison & Hardening Logic:** 
   Comparing v3 `firestore.rules` (which includes a global `match /{document=**} { allow read: if true; allow write: if request.auth != null; }`) with v4 `firestore.rules` reveals a major hardening improvement. The global wildcard was removed, restricting default actions. However, specific collections such as `voyage_*` bypass this hardening because they have explicit `allow read, write: if true;` entries.

2. **Storage Vulnerability Logic:** 
   In `storage.rules`, the directory match is a generic wildcard: `match /{allPaths=**}`. The write rule specifies `allow write: if request.auth != null;`. Because there are no path checks (such as verifying a path matches `request.auth.uid`), any logged-in user can execute a write, override, or delete on *any* path in the bucket, exposing user avatars and vehicle showcase assets to cross-account modification or data deletion.

3. **Deployment Blockage Logic:** 
   The `firebase.json` target lists both security rules and hosting source (`"source": "."`). Under Firebase CLI framework-aware compilation (Next.js), `firebase deploy` triggers a dynamic build. 
   As observed in `firebase-debug.log`, the local TypeScript compiler failed because `accuracy` was passed as a parameter in `src/app/dash/page.tsx:290`, violating the `{ lat: number; lng: number }` contract specified on line 91. 
   Because the compilation failed, the CLI aborted the deploy sequence before launching rulesets uploads. Thus, the new `firestore.rules` and `storage.rules` are prevented from synchronizing with production.

4. **Independent Synchronization Logic:** 
   To resolve rules synchronization failures during dynamic app compilation errors, rules-only deploys can be executed with target-specific qualifiers (`--only firestore:rules` or `--only storage:rules`), bypassing the Next.js compiler.

---

## 3. Caveats

- **External API Boundaries:** We assumed that the backend configuration has not bypassed rules via custom Firestore extensions or Cloud Functions, as we cannot inspect live cloud resources without credentials or in CODE_ONLY mode.
- **Voyage Cockpit Intent:** We assume the completely open `allow read, write: if true` rules on `voyage_*` collections are designed as sandbox test entries, but they represent a vulnerability regardless.
- **Staging Project:** No actual dry-runs were executed on live Google Cloud services, given the read-only operational constraint of this subagent.

---

## 4. Conclusion

1. **Security Vulnerabilities:**
   - **Voyage Cockpit:** Public read/write on `/voyage_*/{id}` exposes client data to spamming and unauthenticated manipulation.
   - **Cloud Storage:** Lack of directory gating in `storage.rules` allows any authenticated user to delete or overwrite other users' files.
2. **Synchronization Blockage:**
   - Next.js compilation errors (specifically the coordinate type mismatch on `accuracy` at line 290 in `src/app/dash/page.tsx`) completely halt the standard `firebase deploy` workflow. This leaves new rules unapplied.
3. **Remediation Strategy:**
   - Deploy security rules independently with isolated deploy flags (`firebase deploy --only firestore:rules,storage:rules`).
   - Clean up the TypeScript error in `src/app/dash/page.tsx:290` (either remove `accuracy` or add it to the `location` interface type).
   - Harden `storage.rules` to scope user files by path checks.

---

## 5. Verification Method

- **Inspecting Local Rules:** 
  View `c:\_Projects\Gridpass-v4\firestore.rules` and `c:\_Projects\Gridpass-v4\storage.rules` to confirm permissions.
- **Isolating Rules Deployments:**
  Run the rules-only synchronization command in the workspace directory to verify Firebase CLI parses it correctly:
  ```powershell
  firebase deploy --only firestore:rules,storage:rules
  ```
- **Local Rules Unit Testing:**
  Spawn the local emulator:
  ```powershell
  firebase emulators:start --only firestore,storage
  ```
  Write and execute unit tests checking public write restrictions on `system_logs` or path overrides on dynamic views using `@firebase/rules-unit-testing`.
- **TypeScript Compliance:**
  Verify the type error can be checked or reproduced locally:
  ```powershell
  npm run build
  ```
  Or run the Playwright test orchestrator:
  ```powershell
  node run-tests.js
  ```
