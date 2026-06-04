# Gridpass Firebase Dynamic Deployment & Security Rules Evaluation Report

## 1. Overview & Scope

This report evaluates the correctness, completeness, and robustness of the Firebase dynamic deployment, routing configuration, and security rules (`firestore.rules` and `storage.rules`) for **gridpass.app** (Gridpass-v4).

The evaluation is based on:
1. Direct inspection of the build and deployment logs from `c:\_Projects\Gridpass-v4\.agents\worker_m3\report.md`.
2. Static analysis of the routing architecture defined by Next.js 16.2.6 (Turbopack) and the experimental Firebase `webframeworks` integration.
3. Logical analysis, edge-case mining, and adversarial stress-testing of Firestore and Storage security rules.
4. Independent local verification via E2E orchestrator execution (`node run-tests.js`).

---

## 2. Review Summary & Verdict

**Verdict**: **REQUEST_CHANGES** (Critical Security Findings)

While the Next.js compilation, Firebase Hosting build pipelines, dynamic SSR Cloud Run functions provisioned perfectly, and the E2E suite passes 100% locally with zero errors, the actual deployed **Firestore and Storage security rules are extremely permissive and represent severe security vulnerabilities** that must be resolved before the production environment is certified.

---

## 3. Verified Claims & Evidence Chain

- **Claim 1**: The Next.js application compiles and runs E2E tests cleanly under Next.js 16.2.6 and Turbopack.
  - *Verification Method*: Executed `node run-tests.js` inside `c:\_Projects\Gridpass-v4`.
  - *Result*: **PASS**. The server initialized in 415ms, and all 10 Playwright tests completed successfully in 13.2s.
- **Claim 2**: Firebase security rules compiled and released successfully in the deployment log.
  - *Verification Method*: Inspected verbatim deployment outputs in `worker_m3/report.md`.
  - *Result*: **PASS**. Lines 216 and 220 confirm `rules file storage.rules compiled successfully` and `rules file firestore.rules compiled successfully` before successful release.
- **Claim 3**: Dynamic routes and API routes are routed correctly to a serverless backend.
  - *Verification Method*: Inspected generated files in `.firebase/gridpass`.
  - *Result*: **PASS**. Identified `.firebase/gridpass/hosting` contains static pages (e.g., `about.html`, `pricing.html`) served via global CDN, while `.firebase/gridpass/functions/server.js` acts as the serverless host for all dynamic, dynamic-parameter, and API routes (e.g., `/u/[id]`, `/v/[id]`, `/api/billing/*`), fulfilling the hybrid static/dynamic requirements.

---

## 4. Quality Review Findings

### [Critical] Finding 1: Completely Public Read/Write on Voyage AI collections
- **Where**: `firestore.rules` (Lines 60-67)
- **What**: The following collections are wide open:
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
- **Why**: Allows any unauthenticated, anonymous internet client to read, create, update, and delete documents in these critical collections. A malicious actor can wipe out all registered trips, manifests, or gates, or upload garbage documents, causing data loss and database bloat.
- **Suggestion**: Restrict access to authenticated users, resource owners, or specific roles. At minimum, change `allow read, write: if true;` to `allow read, write: if request.auth != null;` (or refine based on actual application ownership).

### [Critical] Finding 2: Unrestricted Storage Write & Delete Access
- **Where**: `storage.rules` (Lines 4-10)
- **What**: The storage catch-all rules allow any authenticated user to write and delete any file:
  ```javascript
  match /{allPaths=**} {
    allow read: if true;
    allow write: if request.auth != null;
  }
  ```
- **Why**: Any logged-in user can overwrite or delete files belonging to other users (e.g., avatar images, showcase images, or private attachments). An attacker could overwrite another driver's vehicle showcase image with malware, delete all files in the bucket, or spam the bucket with large video uploads to drive up GCP storage costs.
- **Suggestion**: Structure paths by ownership (e.g., `/users/{userId}/avatar.png` or `/vehicles/{vehicleId}/showcase.png`) and enforce path-based authorization.

### [Major] Finding 3: Lack of owner_id validation on Document Creation
- **Where**: `firestore.rules` (Lines 30-36, 39-46)
- **What**: In the `vehicles` and `businesses` collections, create rules permit any authenticated user to write documents:
  ```javascript
  allow create: if request.auth != null;
  ```
- **Why**: There is no assertion that `request.resource.data.owner_id == request.auth.uid`. A logged-in user B can create a vehicle document and set the `owner_id` to user A's UID. While user B won't be able to update/delete it afterwards, it allows user B to spoof registrations or pollute user A's digital garage with unauthorized assets.
- **Suggestion**: Require that the `owner_id` in the uploaded data matches the creator's authenticated UID:
  ```javascript
  allow create: if request.auth != null && request.resource.data.owner_id == request.auth.uid;
  ```

### [Major] Finding 4: Hardcoded Super-Admin Email Authorization
- **Where**: `firestore.rules` (Lines 8, 14, 20, 26, 35, 45, 54, 56)
- **What**: Administrative access is hardcoded to a single email: `'loseyp@gmail.com'`.
- **Why**: Hardcoding administrative identities in security rules is fragile, prone to human error, and poses serious security risks. If the admin email changes, the rules must be rewritten and redeployed. Furthermore, testing and staging environments cannot use different admin accounts without altering code.
- **Suggestion**: Use custom claims (e.g., `request.auth.token.admin == true`) or query a central `/admins/{uid}` collection to authorize administrative tasks.

### [Major] Finding 5: Potential Firestore Rules Runtime Crash on views count increment
- **Where**: `firestore.rules` (Lines 70-75)
- **What**: The dynamic views count increment logic uses:
  ```javascript
  request.resource.data.views == resource.data.views + 1
  ```
- **Why**: If a vehicle, business, or user document is newly created without a `views` property, `resource.data.views` will evaluate to `undefined` during an update. Referencing an undefined key in a security rules expression causes a **runtime exception**, which instantly aborts evaluation and rejects the update. This prevents incrementing the views on any documents that do not already have the property seeded.
- **Suggestion**: Use the `get()` fallback function to resolve default views if missing:
  ```javascript
  request.resource.data.views == resource.data.get('views', 0) + 1
  ```

### [Major] Finding 6: Broad Public Read Access on Users Collection
- **Where**: `firestore.rules` (Lines 50-51)
- **What**: The `users` collection allows public read:
  ```javascript
  allow read: if true;
  ```
- **Why**: If user documents contain personally identifiable information (PII) such as personal email, billing addresses, Stripe customer tokens, subscription statuses, or internal metadata, making the collection public compromises user privacy.
- **Suggestion**: Restrict reading the entire user profile to the authenticated owner and administrators:
  ```javascript
  allow read: if request.auth != null && (userId == request.auth.uid || request.auth.token.email == 'loseyp@gmail.com');
  ```
  If public profile components are required (e.g. for `/u/pjlosey`), extract those fields to a dedicated `/public_profiles/{userId}` collection.

---

## 5. Adversarial Review (Critic)

**Overall Risk Assessment**: **CRITICAL**

### Challenge 1: Tenant-to-Tenant Data Deletion (Storage)
- **Assumption Challenged**: Authentication acts as a sufficient safety perimeter for bucket writes.
- **Attack Scenario**: User A uploads a vehicle showcase image named `showcase.jpg` into storage. User B (who is authenticated, but malicious) issues a standard `delete()` request targeting User A's file. The storage rules only check `request.auth != null`, which is true for User B.
- **Blast Radius**: **HIGH**. An attacker can delete or corrupt every single media file (avatar, invoice, showcase image) in the application bucket.
- **Mitigation**: Bind storage paths to user IDs, and validate that users can only write/delete files matching their UID.

### Challenge 2: Voyage Database Wiping (Firestore)
- **Assumption Challenged**: Open rules for `/voyage_*` are acceptable for quick developer iterations without side effects.
- **Attack Scenario**: An anonymous user issues a batch delete or set operation targeting `/voyage_trips/` or `/voyage_manifests/`. Because of `allow read, write: if true;`, the operation is authorized without checks.
- **Blast Radius**: **CRITICAL**. Total loss of all paddock voyages, emergency pet passports, manifests, and rider schedules.
- **Mitigation**: Gating the rules behind a minimum of `request.auth != null`.

### Challenge 3: Registration Spoofing & Garage Pollution
- **Assumption Challenged**: Standard validation can be fully deferred to client-side application logic.
- **Attack Scenario**: User B writes a script that repeatedly registers high-end vehicles in `/vehicles` but injects User A's UID as `owner_id`. The client-side dashboard loads the collection based on `owner_id == currentUser.uid`. User A's dashboard is suddenly flooded with thousands of garbage cars.
- **Blast Radius**: **MEDIUM**. Pollutes database, degrades dashboard performance, and degrades user experience.
- **Mitigation**: Require server-side verification in Firestore rules: `request.resource.data.owner_id == request.auth.uid`.

---

## 6. Stress Test Scenarios

| Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| **Anonymous Voyage Deletion** | Reject deletion | Authorized successfully | **FAIL** (Severe Vulnerability) |
| **Authenticated User B deletes User A's Avatar** | Reject delete operation | Authorized successfully | **FAIL** (Severe Vulnerability) |
| **User B registers vehicle with User A's UID** | Reject write operation | Authorized successfully | **FAIL** (Vulnerability) |
| **Increment view count on fresh vehicle** | Update view count to 1 | Request aborts due to rules error | **FAIL** (Logical Bug) |

---

## 7. Resolution & Hardening Code Blocks

To secure the application, replace the current rules files with the hardened configurations below.

### Hardened `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Centralized Logging Rules: Public write/anonymous creation, strictly restricted reading
    match /system_logs/{logId} {
      allow create: if true; // Public telemetry pipeline
      allow read, update, delete: if request.auth != null && request.auth.token.email == 'loseyp@gmail.com'; // Strict super-admin gate
    }
    
    // Issue and Feedback Dispatch Queue Rules: Public write, strictly restricted reading
    match /feedback_queue/{ticketId} {
      allow create: if true; // Allow anyone to submit feedback and bugs
      allow read, update, delete: if request.auth != null && request.auth.token.email == 'loseyp@gmail.com'; // Super-admin queue only
    }

    // Swarm Interlock / Active Questions: Public read, strictly gated write to loseyp@gmail.com
    match /swarm_interlock/{questionId} {
      allow read: if true; // Public reading for swarms and users
      allow write: if request.auth != null && request.auth.token.email == 'loseyp@gmail.com'; // Strictly gated to owner
    }

    // Geolocation Scans analytics rules: Public creation, restrict read to super-admin
    match /tag_scans/{scanId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null && request.auth.token.email == 'loseyp@gmail.com';
    }

    // Vehicles collection
    match /vehicles/{vehicleId} {
      allow read: if true; // Public profiles are resolvable by QR scans
      allow create: if request.auth != null && request.resource.data.owner_id == request.auth.uid; // Must own registered asset
      allow update, delete: if request.auth != null && (
        resource.data.owner_id == request.auth.uid || 
        request.auth.token.email == 'loseyp@gmail.com'
      );
    }

    // Businesses collection
    match /businesses/{businessId} {
      allow read: if true; // Public listings & entities
      allow create: if request.auth != null && request.resource.data.owner_id == request.auth.uid; // Must own registered business
      allow update, delete: if request.auth != null && (
        resource.data.owner_id == request.auth.uid || 
        request.auth.token.email == 'loseyp@gmail.com'
      );
    }

    // Users collection
    match /users/{userId} {
      allow read: if true; // Public profiles (should separate sensitive data to a subcollection)
      allow create, update: if request.auth != null && (
        userId == request.auth.uid || 
        request.auth.token.email == 'loseyp@gmail.com'
      );
      allow delete: if request.auth != null && request.auth.token.email == 'loseyp@gmail.com';
    }

    // Voyage AI Adventure Cockpit Rules (Gated to authenticated users or resource owners)
    match /voyage_trips/{id} { allow read, write: if request.auth != null; }
    match /voyage_manifests/{id} { allow read, write: if request.auth != null; }
    match /voyage_pets/{id} { allow read, write: if request.auth != null; }
    match /voyage_gates/{id} { allow read, write: if request.auth != null; }
    match /voyage_riders/{id} { allow read, write: if request.auth != null; }
    match /voyage_pitches/{id} { allow read, write: if request.auth != null; }
    match /voyage_claims/{id} { allow read, write: if request.auth != null; }
    match /voyage_tickets/{id} { allow read, write: if request.auth != null; }

    // Dynamic views count increment exception for analytics (Harden undefined check)
    match /{collection}/{document} {
      allow update: if 
        (collection == 'users' || collection == 'vehicles' || collection == 'businesses') &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['views']) &&
        request.resource.data.views == resource.data.get('views', 0) + 1;
    }
  }
}
```

### Hardened `storage.rules`
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Public files (avatars, showcase pictures) - Public read, path-isolated write/delete
    match /public/{allPaths=**} {
      allow read: if true;
    }
    
    // User Avatars - Gated to the owner of the user profile
    match /users/{userId}/avatar.png {
      allow read: if true; // Public read
      allow write: if request.auth != null && request.auth.uid == userId; // Owner write/delete only
    }
    
    // Vehicle Showcase - Gated to the owner of the vehicle showcase
    match /vehicles/{userId}/{vehicleId}/{fileName} {
      allow read: if true; // Public read
      allow write: if request.auth != null && request.auth.uid == userId; // Owner write/delete only
    }

    // Private records (e.g. detailed vehicle invoices, pet health logs)
    match /private/users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId; // Strict owner isolation
    }
  }
}
```
