# Milestone 3 Gating Verification Remediation Synthesis Report (Round 3)

This report consolidates, reconciles, and synthesizes the findings from the five independent gating verification subagents in the third gating round (Reviewer 1 Gen 4, Reviewer 2 Gen 4, Challenger 1 Gen 4, Challenger 2 Gen 4, and the Forensic Auditor Gen 4) who evaluated the Landing Experience UX Specification (`join_conversion_ui.md`) for Milestone 3.

---

## 1. Catalog of Inputs & Subagent Status

| Agent ID | Role | Focus | Verdict | Confidence | Key Artifacts |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `b81947a6-a14e-4621-a6a9-ca373e5b4e91` | Reviewer 1 Gen 4 | Visual co-branding layouts & mobile viewports | **APPROVED WITH CONDITION** | 98% (High) | `review.md`, `handoff.md` |
| `a4c1473a-0665-4a91-825a-c20b3b652f52` | Reviewer 2 Gen 4 | Touch interactive target mechanics & mobile schemas | **APPROVED** | 98% (High) | `review.md`, `handoff.md` |
| `5e1b1f27-e66a-4b88-8f3f-512cf40e629f` | Challenger 1 Gen 4 | Sunlight mode, SMS OTP bypass, offline crypto | **BLOCKED (VETO)** | 100% (Very High) | `challenge.md`, `handoff.md` |
| `772981c1-347c-453c-8cda-65dd6f0c43ca` | Challenger 2 Gen 4 | Fitts's Law touch targets, vibration & bypass exploits | **BLOCKED (VETO)** | 100% (Very High) | `challenge.md`, `handoff.md` |
| `3560790a-1b0a-4d09-994c-cd1f7e26c78b` | Forensic Auditor Gen 4 | Visual/Technical schema authenticity & compliance | **CLEAN (PASSED)** | 100% (Absolute) | `audit.md`, `handoff.md` |

**Verification Gate Result:** 🔴 **FAIL**. Although Reviewer 2 APPROVED and the Forensic Auditor returned a CLEAN audit, the gate is blocked by critical architectural, cryptographic, and security exploits identified by Challenger 1 and Challenger 2, along with mandatory remediation conditions from Reviewer 1. A comprehensive remediation loop (Worker Gen 6 M3) is required to resolve these gaps in `join_conversion_ui.md`.

---

## 2. Remaining Blocker Gaps (For Worker Gen 6 Remediation)

We have consolidated the blocker gaps that must be resolved in `join_conversion_ui.md`:

### Gap 1: Casing & Schema Standardizations (Data Validation Safety)
*   **Finding:** A critical casing mismatch exists between the Firestore database (`is_unverified_bypass` snake_case) and the `/api/resolve-tag` JSON schema (`isUnverifiedBypass` camelCase). Because `isUnverifiedBypass` is marked as **required** in the JSON contract, this mismatch will cause API validator crashes or payload rejections. Furthermore, while the database records towing fields (`tow_vehicle_type`, `tow_vehicle_plate`, `trailer_type`), the `/api/resolve-tag` schema completely omits them from `registrationContext`, blocking marshals from doing visual rig-matching checks.
*   **Remediation:** 
    - Keep snake_case in Firestore but map / parse correctly. Update the `/api/resolve-tag` schema to clearly map or standardize naming. Add the missing towing-audit fields (`towVehicleType` string, `towVehiclePlate` string/null, `trailerType` string) under the `/api/resolve-tag` JSON schema `registrationContext.properties` and add them to standard resolver descriptions.

### Gap 2: Protobuf Circular Dependency & Serialization Drift (Offline Verification Safety)
*   **Finding:** The protobuf schema has `bytes ed25519_signature = 9;` *inside* the payload being signed. This forces scanning apps to re-serialize the payload to verify signatures. Due to non-deterministic binary serialization order across languages (Kotlin/Swift/NodeJS), signature verification will fail for 100% of valid offline users.
*   **Remediation:** Implement a strict cryptographic envelope pattern `SignedSecurePass` that encapsulates the raw serialized metadata and the signature separately:
    ```protobuf
    message SignedSecurePass {
      bytes serialized_metadata = 1; // Immutable raw bytes of SecurePassMetadata
      bytes ed25519_signature   = 2; // Ed25519 signature generated directly over serialized_metadata
    }
    ```
    Verify the signature over the raw bytes *before* parsing `serialized_metadata` into `SecurePassMetadata`.

### Gap 3: Offline Passenger Waiver Evasion Loophole (Catastrophic Legal Risk)
*   **Finding:** While the `registrations` Firestore schema tracks passengers (`passenger_registration_ids`), the offline `SecurePassMetadata` Protobuf payload contains no passenger waiver proof. Offline scanner marshals cannot verify passenger waivers, exposing venues to immense liability.
*   **Remediation:** Extend `SecurePassMetadata` to include passenger waiver confirmations:
    - Add `repeated string passenger_waiver_hashes = 10;` (e.g. first 8-chars of SHA256 waiver hashes) to `SecurePassMetadata` to allow offline verification of passengers.

### Gap 4: Ambient Light Sensor API State Pollution & Race Condition (UI Stability)
*   **Finding:** The `sensor.addEventListener('reading', ...)` callback lacks override checks. If a user manually overrides the Solar Light Mode, the background callback (firing every 2 seconds) will immediately overwrite and wipe out the user's manual styling choices.
*   **Remediation:** Update the callback code to check the override state *inside* the event handler:
    ```javascript
    sensor.addEventListener('reading', () => {
      if (localStorage.getItem('manual-theme-override')) {
        return; // Exit immediately if manual override exists
      }
      if (sensor.illuminance > 8000) {
        document.body.classList.add('solar-light-mode');
      } else {
        document.body.classList.remove('solar-light-mode');
      }
    });
    ```

### Gap 5: Spectator Bypass Ingress Lane Lockouts & Active Lock (UI/Physical Security)
*   **Finding:** Active drivers towing rigs can bypass SMS OTP by self-declaring as "spectators" to avoid waivers. In high-traffic gates, busy marshals might miss the orange pass background.
*   **Remediation:** 
    - Mandate that marshal scanning app terminals must block spectator passes in vehicle ingress lanes.
    - Spec a hard lock out: if a spectator pass is scanned in a vehicle lane, trigger a persistent alarm/haptic vibration and screen block: **BLOCKED: SPECTATOR PASS IN VEHICLE LANE**.
    - Explicitly state that spectator passes completely omit vehicle and technical fields.

### Gap 6: Relax Temporal Window & Mesh Offline Warning (Operational Resilience)
*   **Finding:** A ±15-minute validity window is physically unrealistic for gate queues, causing false-rejections. P2P mesh network drops between scanners also allow duplicate screenshot scans.
*   **Remediation:**
    - Expand the temporal validity window to **4 hours**.
    - Mandate that if a gate scanner terminal drops mesh synchronization for >30 seconds, it must display a high-contrast banner: **MESH OFFLINE — RUNNING IN ISOLATED MODE**.
    - In isolated mode, marshals must perform a manual visual comparison of the tow vehicle's physical plate against the pass's metadata.

### Gap 7: Captive Portal SSL Untrusted Certificate & Stripped CNA Browser Limitations
*   **Finding:** stripping down the offline gateway Captive Network Assistant (CNA) browser means it lacks IndexedDB and Canvas support, breaking dynamic signatures. Local HTTPS also triggers alarming "SSL Untrusted Certificate" warnings.
*   **Remediation:**
    - Do not host interactive signature canvases on local CNA frames. Instead, pre-cache the full waiver forms and progressive web app (PWA) assets client-side using a Service Worker on the driver's device *prior to arrival* (within the 24-hour pre-caching window).
    - Collect and store signatures completely offline in the client's local IndexedDB, then sync via Bluetooth/NFC/local gateway REST endpoints when in proximity, avoiding raw captive portal viewports entirely.
    - Pin custom CA certificates inside the Service Worker PWA to guarantee secure HTTPS verification without triggering browser SSL warnings.

### Gap 8: Solar Light Mode Graphic/Logo Clash
*   **Finding:** Brand logos and SVGs with fixed colors (e.g. white borders) clash and become completely invisible on white backgrounds in Solar Light Mode.
*   **Remediation:** Ensure all brand graphics and SVG logo layouts have explicit `.solar-light-mode` CSS custom overrides (e.g., swapping stroke/fill colors to black).

---

## 3. Worker Gen 6 Action Plan

Worker Gen 6 must apply these exact nine remediations directly to `join_conversion_ui.md` in the workspace root, run all structural checks, and verify structural syntax layout before handing back control for the final gating round.
