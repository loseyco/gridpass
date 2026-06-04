# Security Rules and Assets Deployment Process Analysis

**Author:** Explorer Subagent `explorer_m3_2`  
**Date:** May 22, 2026  
**Status:** Completed Analysis  

---

## Executive Summary
This report analyzes the security rules structure (Firestore and Storage), deployment mechanisms, and synchronization pipelines for **gridpass.app**. We identify major security improvements in the v4 Firestore rules compared to v3, highlight high-risk configurations in Storage and game-sandbox collections, detail how compilation failure blocks safety rules synchronization, and document commands to verify and safely deploy security rules independently.

---

## 1. Detailed Codebase Rules Analysis

The application manages permissions via `firestore.rules` and `storage.rules`. We examined their operational behavior and compared the evolution from the legacy v3 configuration to v4.

### 1.1 Firestore Security Rules (`firestore.rules`)
Firestore utilizes explicit matching rules to govern access. Legacy v3 rules used a permissive catch-all wildcard at the bottom of the file which let any authenticated user write and anyone read any document in the entire database. In v4, this wildcard was removed in favor of strict, collections-level gates.

#### Firestore Rule matrix (v4)
Below is the collection-by-collection mapping of rules active in the v4 codebase:

| Collection Path | Read Permissions | Write/Update/Delete Permissions | Gated Roles & Hardcoded Emails | Vulnerability/Risk Status |
| :--- | :--- | :--- | :--- | :--- |
| `/system_logs/{logId}` | Restricted to Super-Admin | `create`: Publicly open (anonymous)<br>`read/update/delete`: Super-Admin | `'loseyp@gmail.com'` | **Low Risk.** Public write allows client telemetry ingestion. Reading is locked behind strict email-check. |
| `/feedback_queue/{ticketId}` | Restricted to Super-Admin | `create`: Publicly open<br>`read/update/delete`: Super-Admin | `'loseyp@gmail.com'` | **Low Risk.** Anyone can submit support tickets, but only the administrator can view/manage the queue. |
| `/swarm_interlock/{questionId}` | Publicly readable (`true`) | Gated strictly to Super-Admin | `'loseyp@gmail.com'` | **Low Risk.** Public reads allow swarms to parse questions. |
| `/tag_scans/{scanId}` | Restricted to Super-Admin | `create`: Publicly open<br>`read/update/delete`: Super-Admin | `'loseyp@gmail.com'` | **Low Risk.** Scans can be registered anonymously via GPS scans, but telemetry records are private. |
| `/vehicles/{vehicleId}` | Publicly readable (`true`) | `create`: Authenticated users<br>`update/delete`: Owner or Super-Admin | `resource.data.owner_id == request.auth.uid` or `'loseyp@gmail.com'` | **Medium Risk.** Public reading allows QR resolutions, but anyone who registers can edit/delete their own vehicles. See notes on `views` below. |
| `/businesses/{businessId}` | Publicly readable (`true`) | `create`: Authenticated users<br>`update/delete`: Owner or Super-Admin | `resource.data.owner_id == request.auth.uid` or `'loseyp@gmail.com'` | **Medium Risk.** Identical structure to vehicles. |
| `/users/{userId}` | Publicly readable (`true`) | `create/update`: Self or Super-Admin<br>`delete`: Super-Admin | `userId == request.auth.uid` or `'loseyp@gmail.com'` | **Medium Risk.** Anyone can read public user profile details. |
| `/voyage_trips/{id}` | Publicly readable (`true`) | Publicly writeable (`true`) | None | 🔴 **High Risk.** Completely open read and write to anyone on the internet. |
| `/voyage_manifests/{id}` | Publicly readable (`true`) | Publicly writeable (`true`) | None | 🔴 **High Risk.** Completely open read and write. |
| `/voyage_pets/{id}` | Publicly readable (`true`) | Publicly writeable (`true`) | None | 🔴 **High Risk.** Completely open read and write. |
| `/voyage_gates/{id}` | Publicly readable (`true`) | Publicly writeable (`true`) | None | 🔴 **High Risk.** Completely open read and write. |
| `/voyage_riders/{id}` | Publicly readable (`true`) | Publicly writeable (`true`) | None | 🔴 **High Risk.** Completely open read and write. |
| `/voyage_pitches/{id}` | Publicly readable (`true`) | Publicly writeable (`true`) | None | 🔴 **High Risk.** Completely open read and write. |
| `/voyage_claims/{id}` | Publicly readable (`true`) | Publicly writeable (`true`) | None | 🔴 **High Risk.** Completely open read and write. |
| `/voyage_tickets/{id}` | Publicly readable (`true`) | Publicly writeable (`true`) | None | 🔴 **High Risk.** Completely open read and write. |
| Wildcard Global Exception | Denied | `update` of `views` field on `users`, `vehicles`, or `businesses` | `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['views'])` | **Low Risk.** Safely allows anonymous client-side incrementation of page views (+1 only) without write access to other fields. |

#### Key Firestore Findings:
1. **The Voyage AI Sandbox Vulnerability:** The eight dynamic collections matching `/voyage_*/{id}` are completely open (`allow read, write: if true;`). While this may have been implemented as a rapid sandbox cockpit game simulation, it represents a substantial vector for data spamming, unauthorized mutations, and indexing resource depletion.
2. **Views Count Increment Lock:** The wildcard block:
   ```javascript
   match /{collection}/{document} {
     allow update: if 
       (collection == 'users' || collection == 'vehicles' || collection == 'businesses') &&
       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['views']) &&
       request.resource.data.views == resource.data.views + 1;
   }
   ```
   is a highly efficient and safe implementation. It permits unauthenticated client-side code (e.g. public scans) to increment a profile's `views` count by exactly `1` while blocking all other modifications. Because Firestore allows evaluations via OR, an update by an owner will bypass this constraint (authorized by the collection rule), whereas an update by a public scan is authorized strictly by this override.
3. **Hardcoded Gatekeeper:** The super-admin address `'loseyp@gmail.com'` is hardcoded directly into the security logic. If gridpass.app shifts to multi-tenant or enterprise environments, these policies must be updated to check custom auth claims (e.g. `request.auth.token.admin == true`) rather than string literals.

---

### 1.2 Storage Security Rules (`storage.rules`)
The storage rules active in gridpass.app (`storage.rules`) are identical in both v3 and v4:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Allow public read for vehicle showcases, avatars, and attachments
      allow read: if true;
      
      // Allow writes only from authenticated users
      allow write: if request.auth != null;
    }
  }
}
```

#### Key Storage Findings:
1. 🔴 **Major Vulnerability (Missing Directory Isolation):** Any authenticated user (`request.auth != null`) is permitted to write or delete *any* file at *any* path in the bucket (due to `match /{allPaths=**}`). Under this rule, a malicious authenticated user can overwrite another driver's vehicle showcases, delete profile avatars, or flood the storage root with arbitrary data.
2. **Recommendation for Hardening:** Storage paths should be scoped by UID and dynamic vehicle tags, separating read-only folders from user-managed upload paths:
   ```javascript
   match /users/{userId}/{allPaths=**} {
     allow read: if true;
     allow write: if request.auth != null && request.auth.uid == userId;
   }
   match /vehicles/{vehicleId}/{allPaths=**} {
     allow read: if true;
     // Validate that the user owns this vehicle in Firestore (if using Firestore checks in storage) 
     // or check simple authentication bounds depending on upload metadata
     allow write: if request.auth != null; 
   }
   ```

---

## 2. Compilation and Security Rules Synchronization Mechanisms

We reviewed how the Firebase CLI integrates security rules during a deployment, why compilation blockages halt the pipeline, and how the frameworks affect security synchronization.

### 2.1 Mappings in `firebase.json`
Firebase coordinates multi-resource deployments through the mappings declared in `firebase.json`:
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
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}
```

### 2.2 Framework-Aware Next.js Deployments
Because `gridpass-v4` runs on Next.js 16 and includes a `"hosting"` mapping target with `"source": "."`, the Firebase CLI operates in **framework-aware hosting mode**. This shifts the standard static upload into a complex serverless pipeline:
1. **Pre-build Phase:** The Firebase CLI inspects the environment and runs framework detection. It sets up Next.js configuration adapters.
2. **Local Compilation:** The CLI spawns the local Next.js compiler (`next build`) to generate the static files and serverless dynamic API routes under `.firebase/gridpass/`.
3. **Execution Guard:** If the compilation process fails, the command immediately exits with a non-zero status code. **No rules, static hosting files, or cloud functions are deployed.** 

#### Current Blockage Example (TypeScript Type Error):
In our local investigation of the `firebase-debug.log`, we observed the deployment pipeline aborted completely during the compilation phase:
```text
[info] Failed to type check.
[info] ./src/app/dash/page.tsx:290:52
Type error: Object literal may only specify known properties, and 'accuracy' does not exist in type '{ lat: number; lng: number; }'.
[info] > 290 |           location: { lat: 42.3601, lng: -71.0589, accuracy: 10 }
[info] Next.js build worker exited with code: 1
[debug] Error: ENOENT: no such file or directory, open 'C:\_Projects\Gridpass-v4\.next\export-marker.json'
[error] Error: An unexpected error has occurred.
```
*Impact:* Because the typecheck failed on `accuracy: 10` inside `src/app/dash/page.tsx:290` (where `DashboardTagScan` expect `location?: { lat: number; lng: number } | null` with no `accuracy` property), the Next.js compilation terminated. Consequently, the new hardened v4 `firestore.rules` were never pushed to production, keeping the older v3 rules active.

### 2.3 Rules Synchronization Phase
If compilation succeeds, the CLI initiates the API upload pipeline:
- **API Requests:** The Firebase CLI calls the Google Firebase Rules API (`firebaserules.googleapis.com`) to register a new versioned ruleset containing the files `firestore.rules` and `storage.rules`.
- **Releases Binding:** Once the ruleset is accepted, the API updates the active releases (e.g. `projects/gridpass/releases/cloud.firestore`). This update is instantaneous and immediately affects all live client requests.
- **Transactional Weakness:** The deployment is *not* transactionally atomic across services. If rules are updated successfully but the subsequent Hosting CDN upload fails, the rules remain active on the live project while the site assets are rolled back. 

---

## 3. Testing and Deployment Playbook

To avoid locking rules synchronization behind code compilation and ensure that security policies are thoroughly validated, developers should leverage discrete CLI targets and local emulators.

### 3.1 Rules-Only Synchronization (Isolation)
When typescript compilation errors are present in the web app, or when you wish to safely deploy security adjustments without triggering a long, framework-aware Next.js production build, use the **`--only`** flag to isolate targets:

```powershell
# Deploy Firestore security rules only (extremely fast, bypasses web build)
firebase deploy --only firestore:rules

# Deploy Cloud Storage security rules only
firebase deploy --only storage:rules

# Deploy all security rules together, bypassing web app code completely
firebase deploy --only firestore:rules,storage:rules
```

### 3.2 Offline Emulator Suite Testing
Deploying rules directly to production is unsafe. The recommended verification method is executing local unit tests against the Firebase Emulator Suite.

1. **Start the local emulator in headless mode:**
   ```powershell
   firebase emulators:start --only firestore,storage
   ```
2. **Execute tests targeting local databases:**
   In your client tests (e.g. Vitest/Jest using `@firebase/rules-unit-testing`), specify the local emulator ports (default `8080` for Firestore, `9199` for Storage) and run security checks (e.g. testing that `views` can be incremented anonymously, but other updates fail).

### 3.3 Dry-Run Validations
While `firebase deploy` does not feature a complete dry-run validation flag that checks API boundaries on remote projects without deploying, developers can utilize staging environments:

1. **Establish a Staging Target:**
   ```powershell
   firebase use gridpass-staging
   ```
2. **Verify Rules on Staging:**
   ```powershell
   firebase deploy --only firestore:rules,storage:rules
   ```
3. **Switch back to Production:**
   ```powershell
   firebase use default
   ```

Alternatively, use the **Rules Playground** built directly into the Google Firebase Web Console (under Firestore -> Rules) to test specific read/write operations against the rules file before editing the repository code.

---

## 4. Architectural Recommendations

1. **Harden Storage Rules:** Immediately scope `storage.rules` to prevent cross-account writes and file deletion.
2. **Secure the Sandbox:** Refactor Voyage AI Adventure Cockpit rules to restrict writes to authenticated profiles, or enforce a structure where writes must possess valid user IDs matching the checking rider.
3. **Resolve compilation lock:** Correct the TypeScript coordinate error in `src/app/dash/page.tsx:290` (removing `accuracy: 10` or updating the interface definition) to unblock general framework deployments.
4. **Isolate rules deploys:** Update CI/CD pipelines to deploy security rules separately from hosting assets, ensuring critical security logic can be updated instantly in case of incidents without waiting for a full app compilation.
