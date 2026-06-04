## 2026-05-22T16:11:52Z

You are Worker Gen 6 M3.
Your working directory is: c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m3_gen6.

Your core mission is to fully remediate the landing experience specification document `c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md` based on the comprehensive findings and action items detailed in the synthesis report `c:\_Projects\Gridpass-v4\business_launch\.agents\orchestrator\milestone3_remediation_synthesis_r3.md`.

Please perform the following actions:
1. Verify the landing experience specification document `c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md` against the 8 gaps specified in the synthesis report `c:\_Projects\Gridpass-v4\business_launch\.agents\orchestrator\milestone3_remediation_synthesis_r3.md`.
2. Fully implement any corrections or additions needed to ensure all 8 gaps are completely, robustly, and flawlessly specified:
   - **Gap 1 (Casing & Schema Standardizations)**: Keep snake_case in Firestore but map/parse correctly. Update the `/api/resolve-tag` schema to clearly map or standardize naming. Add the missing towing-audit fields (`towVehicleType` string, `towVehiclePlate` string/null, `trailerType` string) under the `/api/resolve-tag` JSON schema `registrationContext.properties` and add them to standard resolver descriptions.
   - **Gap 2 (Protobuf Circular Dependency & Serialization Drift)**: Implement a strict cryptographic envelope pattern `SignedSecurePass` that encapsulates the raw serialized metadata and the signature separately:
     ```protobuf
     message SignedSecurePass {
       bytes serialized_metadata = 1; // Immutable raw bytes of SecurePassMetadata
       bytes ed25519_signature   = 2; // Ed25519 signature generated directly over serialized_metadata
     }
     ```
     Verify the signature over the raw bytes before parsing `serialized_metadata` into `SecurePassMetadata`.
   - **Gap 3 (Offline Passenger Waiver Evasion Loophole)**: Extend `SecurePassMetadata` to include passenger waiver confirmations by adding `repeated string passenger_waiver_hashes = 10;` (first 8 characters of SHA256 waiver hashes) to `SecurePassMetadata` to allow offline verification of passengers.
   - **Gap 4 (Ambient Light Sensor API State Pollution & Race Condition)**: Update the callback code to check the override state inside the event handler:
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
   - **Gap 5 (Spectator Bypass Ingress Lane Lockouts & Active Lock)**: Mandate that marshal scanning app terminals must block spectator passes in vehicle ingress lanes. Spec a hard lockout: if a spectator pass is scanned in a vehicle lane, trigger a persistent alarm/haptic vibration and screen block: **BLOCKED: SPECTATOR PASS IN VEHICLE LANE**. Explicitly state that spectator passes completely omit vehicle and technical fields.
   - **Gap 6 (Relax Temporal Window & Mesh Offline Warning)**: Expand the temporal validity window to 4 hours. Mandate that if a gate scanner terminal drops mesh synchronization for >30 seconds, it must display a high-contrast banner: **MESH OFFLINE — RUNNING IN ISOLATED MODE**. In isolated mode, marshals must perform a manual visual comparison of the tow vehicle's physical plate against the pass's metadata.
   - **Gap 7 (Captive Portal SSL Untrusted Certificate & Stripped CNA Browser Limitations)**: Pre-cache the full waiver forms and progressive web app (PWA) assets client-side using a Service Worker on the driver's device prior to arrival (within the 24-hour pre-caching window) rather than hosting interactive signature canvases on local CNA frames. Collect and store signatures completely offline in the client's local IndexedDB, then sync via Bluetooth/NFC/local gateway REST endpoints when in proximity, avoiding raw captive portal viewports entirely. Pin custom CA certificates inside the Service Worker PWA to guarantee secure HTTPS verification without triggering browser SSL warnings.
   - **Gap 8 (Solar Light Mode Graphic/Logo Clash)**: Add `.solar-light-mode` overrides for B2B graphics/SVGs (e.g., swapping stroke/fill colors to black). Ensure all brand graphics and SVG logo layouts have explicit custom CSS overrides.

3. Make sure all formatting, headers, list numbers, and markdown blocks are clean and free of syntax/rendering errors (like stray backticks or cut-off sections).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Upon completing your modifications:
- Perform a thorough self-verification of the file to ensure no formatting or syntax errors exist, and ensure all 8 gaps are completely specified.
- Update your progress in `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m3_gen6\progress.md` at each step to maintain a liveness heartbeat.
- Write a detailed `handoff.md` inside your directory `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m3_gen6\handoff.md` summarizing the exact changes and verification checks.
- Send a completion message back to the orchestrator parent.
