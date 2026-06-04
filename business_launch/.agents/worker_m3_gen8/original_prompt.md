## 2026-05-22T16:18:12Z
Your working directory is: c:\_Projects\Gridpass-v4\business_launch\.agents\worker_m3_gen8.
Your identity is: Worker Gen 8 M3.
Your core mission is to fully remediate the landing experience specification document `c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md` based on the 7 critical remaining blocker gaps detailed in the synthesis report `c:\_Projects\Gridpass-v4\business_launch\.agents\orchestrator\milestone3_remediation_synthesis_r5.md`.

Specifically, implement the following exact changes in `join_conversion_ui.md`:

1. Gap 1: Pre-Arrival Caching vs. Shrunk Gate Validity Window (Operational Lockout - CRITICAL)
   - Issue: Pre-downloaded passes (generated 24h prior) expire immediately under the 30-min gate validity window.
   - Remediation: Specify dual-pass lifecycle differentiation:
     - Pre-Arrival Passes: Valid for entire event active duration (e.g. 24h). Use double-scan replay caches + Screenshot Evasion Guards (visual checks of matching names/license plates decrypted on the marshal's screen) for validation.
     - On-Demand Passes: Strictly validate with 30-minute validity window post-generation at the gate.

2. Gap 2: 32-Bit Truncated Hex-String Passenger Waiver Collision (Legal Waiver Bypass - HIGH)
   - Issue: Hex-encoded 8-char prefixes represent only 32 bits, allowing easy birthday attacks to forge signed waiver prefixes.
   - Remediation: Change the field type in `SecurePassMetadata` from `repeated string passenger_waiver_hashes = 10;` to `repeated bytes passenger_waiver_hashes = 10;` and store 8 bytes of raw binary (64 bits of entropy).

3. Gap 3: Missing Outer Key Identifier & Trial Verification DoS (Medium Risk)
   - Issue: Lack of key identifiers in `SignedSecurePass` causes slow trial verifications or CPU-exhausting DoS under key rotation.
   - Remediation: Add `uint32 signing_key_id = 3;` directly in the outer `SignedSecurePass` protobuf envelope to instantly map the correct public key without trial verifications or parsing untrusted payloads first.

4. Gap 4: Browser Sandbox & Offline Sync Limits (Platform SPOF - CRITICAL)
   - Issue: Background peer-to-peer sync via Web Bluetooth/NFC is blocked in background/Service Workers (especially on iOS). Incognito mode restricts IndexedDB. Wildcard SSL private key exposure on remote gate terminals is a MitM risk. DNS-over-HTTPS (DoH) bypasses local offline DNS resolvers.
   - Remediation:
     - Private Browsing modal: Detect Private/Incognito mode and display high-visibility modal instructing user to switch to standard browsing.
     - Abandon background BLE/NFC sync: Rely strictly on standard local WPA3-Personal Wi-Fi endpoints (`http://192.168.1.1/api/sync-signature`) accessed via active foreground browser fetch loops.
     - Remove Wildcard DNS-to-IP Key Exposure: Use secure local WPA3-Personal networks or localized gateway-specific self-signed certs with simple manual trust prompts, keeping wildcard private keys secure on the cloud.

5. Gap 5: The 30-Second Mesh Network Sync Loss & Split-Brain Duplicates (Operational Fraud - HIGH)
   - Issue: Steel rigs block Wi-Fi; a 30s mesh drop causes marshal alarm fatigue. Split-brain counter caches allow multi-gate entry under Isolated Mode.
   - Remediation: Increase mesh sync loss threshold to 3 minutes; replace loud alarms with a silent warning banner (loud alarms reserved strictly for duplicate scan checks); under Isolated Mode, require physical confirmation tap of the matching license plate read from the vehicle/trailer before manual override.

6. Gap 6: Solar Light Mode CSS Scoping & SVG Image Clashing (UI/Scanning Failures - HIGH)
   - Issue: Sandboxed `<img>` SVGs cannot be styled by document-level CSS rules (white SVGs on white glares). Solar Light Mode overrides wipe out emerald status clear glow animation cues.
   - Remediation: Inline all brand/partner SVGs inside the HTML DOM (e.g. React inline SVG components) instead of using `<img>` tags. Adjust Solar Light Mode overrides to enforce a thick solid green border (`border: 4px solid #10b981 !important; box-shadow: none !important;`) for active clearance cards to preserve 10-foot visual check cues.

7. Gap 7: Cryptographic Terminology Contradiction (LOW)
   - Issue: The spec uses "decrypt and verify" for Ed25519 signatures.
   - Remediation: Correct terminology to "decode the outer envelope and verify the Ed25519 signature over the raw serialized metadata bytes using the pre-loaded public key."

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When your modifications to `c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md` are complete:
- Perform a thorough self-verification of the file to ensure no formatting, syntax, or layout errors exist, and ensure all 7 gaps are completely and robustly specified.
- Update your progress in `c:\_Projects\Gridpass-v4\business_launch\.agents\worker_m3_gen8\progress.md` at each step to maintain a liveness heartbeat.
- Write a detailed `handoff.md` inside your directory `c:\_Projects\Gridpass-v4\business_launch\.agents\worker_m3_gen8\handoff.md` summarizing the exact remediations made.
- Send a completion message back to the orchestrator parent.
