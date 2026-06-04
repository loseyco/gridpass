# Handoff Report — Reviewer & Adversarial Critic

This handoff report is prepared in accordance with the 5-component team protocol to independently assess the Firebase dynamic deployment, security rules configuration, and serverless Cloud Run performance for gridpass.app.

---

## 1. Observation

Direct observations and file records:

1. **Missing Rules for Live Collections**:
   - `firestore.rules` (lines 1-78) does **not** define rules for the collections: `voyage_checkins`, `voyage_tags`, or `service_logs`.
   - `/src/app/adventure/page.tsx` reads and writes to `voyage_checkins` at line 712 (`collection(db, 'voyage_checkins')`) and `voyage_tags` at line 778 (`collection(db, 'voyage_tags')`).
   - `/src/app/v/[id]/page.tsx` reads and writes to `service_logs` at line 137 (`collection(db, 'service_logs')`) and line 225 (`addDoc(collection(db, 'service_logs'), logData)`).

2. **Unrestricted Voyage Write Gates**:
   - `firestore.rules` (lines 59-67) explicitly sets completely open public access to 8 voyage collections:
     ```firestore
     match /voyage_trips/{id} { allow read, write: if true; }
     match /voyage_manifests/{id} { allow read, write: if true; }
     match /voyage_pets/{id} { allow read, write: if true; }
     match /voyage_gates/{id} { allow read, write: if true; }
     match /voyage_riders/{id} { allow read, write: if true; }
     match /voyage_pitches/{id} { allow read, write: if true; }
     match /voyage_claims/{id} { allow read, write: if true; }
     match /voyage_tickets/{id} { allow read, write: if true; }
     ```

3. **Stripe Webhook Signature Bypass**:
   - `/src/app/api/billing/webhook/route.ts` (lines 18-23) contains this fallback check:
     ```typescript
     if (endpointSecret && sig) {
       event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
     } else {
       // In development environments without webhook proxy, we parse directly
       event = JSON.parse(payload);
     }
     ```
   - If the webhook request is sent *without* the `stripe-signature` header, the variable `sig` defaults to `""` (line 12: `const sig = request.headers.get('stripe-signature') || '';`), which causes `endpointSecret && sig` to evaluate to `false`, bypassing the `constructEvent` signature validation and directly parsing the JSON payload.

4. **E2E Test Mocking**:
   - `tests/gridpass.spec.ts` (lines 5-9) injects a global browser flag before each test:
     ```typescript
     await page.addInitScript(() => {
       (window as any).__PLAYWRIGHT_MOCK__ = true;
     });
     ```
   - In `/src/app/dash/page.tsx` (lines 165-182) and `/src/app/adventure/page.tsx` (lines 133-198), if `window.__PLAYWRIGHT_MOCK__` is truthy, the code bypasses actual database listeners and returns hardcoded mock lists.
   - The Playwright tests complete with **10 passed (11.7s)** as per the worker's report in `/worker_m3/report.md` (lines 255-288).

5. **Unauthenticated Cron Endpoint**:
   - `/src/app/api/cron/growth-engine/route.ts` (line 4) exposes GET handler `export async function GET(request: Request)` with no validation of authentication headers or security tokens.

---

## 2. Logic Chain

1. **In Firestore**, any collection not explicitly matched and permitted by a rule is blocked by default (`default-deny`). Since `voyage_checkins`, `voyage_tags`, and `service_logs` are completely omitted from `firestore.rules` (Observation 1), they will throw **Permission Denied** errors in production.
2. **Because E2E tests** inject `__PLAYWRIGHT_MOCK__ = true` into the browser (Observation 4), they bypass real Firestore calls completely, returning local hardcoded mocks. Consequently, the tests passed flawlessly and **failed to catch these permission-denied bugs**. This represents a severe blindspot/short-circuit in verification.
3. **By setting `allow read, write: if true`** on the 8 `voyage_*` collections (Observation 2), any user, authenticated or anonymous, can overwrite or delete records. This is a severe integrity risk.
4. **By permitting fallback JSON parsing** when `stripe-signature` is omitted or empty (Observation 3), a malicious actor can bypass the signature gate in production by sending requests with no `stripe-signature` header, forging successful payment completions.
5. **By leaving the cron route open** (Observation 5), any external client can trigger it, which creates a denial of service (DoS) or quota exhaustion risk if/when actual marketing/emails are wired into the growth engine.

---

## 3. Caveats

- We have not run the Next.js app in a live production environment under load to measure exact cold starts; our assessment is based on serverless architecture profiles.
- We assume that Stripe webhook secrets and other secrets are stored in standard production environmental variables, but even if they are, the signature bypass bypasses the validation if the client omits the signature header.
- Alternative interpretation considered: The wide-open `voyage_*` rules and Playwright mocks might have been explicitly written to speed up prototyping. However, leaving them in a production deployment setup poses active security and operational risks that must be reported.

---

## 4. Conclusion

Our final assessment is a verdict of **REQUEST_CHANGES**. The project compiles and deploys perfectly, but is functionally broken on several main features in production due to omitted Firestore rules, and has critical security vulnerabilities (Stripe signature bypass and wide-open public database writes).

The next step is for the implementation team to:
1. Extend `firestore.rules` to cover the missing collections (`voyage_checkins`, `voyage_tags`, `service_logs`) and secure the wide-open `voyage_*` collections.
2. Fix the signature validation in `/src/app/api/billing/webhook/route.ts` to fail shut in production when signatures are missing.
3. Gate the cron route with an API key token.

---

## 5. Verification Method

To independently verify these findings, developers should:

1. **Check firestore rules coverage**:
   Compile and run the Firestore Emulator locally with production rules:
   ```powershell
   firebase emulators:start --only firestore
   ```
   Disable `__PLAYWRIGHT_MOCK__` in the browser or via code and attempt to view `/adventure` or `/v/gridpass-demo-vehicle`. You will see Firestore permission-denied warnings in the developer console.

2. **Verify Stripe signature bypass**:
   Send a forged `POST` payload to `http://localhost:3000/api/billing/webhook` containing `checkout.session.completed` for a vehicle upgrade, and do not include the `stripe-signature` header. Verify that the server log outputs `Vehicle upgraded to Premium`.

3. **Inspect Rules File**:
   View `firestore.rules` to confirm the absence of matches for `voyage_checkins`, `voyage_tags`, and `service_logs`.
