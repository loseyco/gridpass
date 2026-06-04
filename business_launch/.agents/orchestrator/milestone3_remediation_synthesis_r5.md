# Milestone 3 Gating Verification Remediation Synthesis Report (Round 5)

This report consolidates, reconciles, and synthesizes the findings and action items from the five independent gating verification subagents in the fifth gating round (Reviewer 1 Gen 4 M3, Reviewer 2 Gen 4 M3, Challenger 1 Gen 4 M3, Challenger 2 Gen 4 M3, and the Forensic Auditor Gen 5 M3) who evaluated the Landing Experience UX Specification (`join_conversion_ui.md`) for Milestone 3 after the remediation by Worker Gen 7 M3.

---

## 1. Catalog of Inputs & Subagent Status

| Agent ID | Role | Focus | Verdict | Confidence | Key Artifacts |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `881a879f-3873-40da-9258-09dd4e0df2c2` | Reviewer 1 Gen 4 M3 | Visual co-branding layouts & mobile viewports | **APPROVED** | 98% (High) | `review.md`, `handoff.md` |
| `f077b7c5-bbc1-458b-af8a-368a7d40ff46` | Reviewer 2 Gen 4 M3 | Touch target height & manual overrides | **APPROVED** | 98% (High) | `review.md`, `handoff.md` |
| `d1620c64-d7d9-48ca-8228-e648ed8e9290` | Challenger 1 Gen 4 M3 | Cryptographic SignedSecurePass & passenger waiver evasion | **BLOCKED (VETO)** | 100% (Very High) | `challenge.md`, `handoff.md` |
| `2fc5e74a-a7e6-4b79-86a1-e4fbc768dad1` | Challenger 2 Gen 4 M3 | Mesh offline, PWA storage isolation & glare overrides | **BLOCKED (VETO)** | 100% (Very High) | `challenge.md`, `handoff.md` |
| `a70ef36c-e532-4e58-b4a7-23e77c03642a` | Forensic Auditor Gen 5 M3 | Technical compliance & visual/schema authenticity | **CLEAN (PASSED)** | 100% (Absolute) | `audit.md`, `handoff.md` |

**Verification Gate Result:** 🔴 **FAIL**. Although both Reviewers APPROVED and the Forensic Auditor returned a CLEAN audit, the gate is blocked by 7 critical, high, and medium architectural, cryptographic, and security vulnerabilities identified by Challenger 1 and Challenger 2. A comprehensive remediation loop (Worker Gen 8 M3) is required to resolve these remaining gaps in `join_conversion_ui.md`.

---

## 2. Remaining Blocker Gaps (For Worker Gen 8 Remediation)

We have consolidated the blocker gaps that must be resolved in `join_conversion_ui.md` to achieve full approval:

### Gap 1: Pre-Arrival Caching vs. Shrunk Gate Validity Window (Operational Lockout - CRITICAL)
*   **Finding:** A critical operational lockout collision exists. The specification mandates that all Apple/Google Wallet `.pkpass` bundles be pre-generated, cryptographically signed, and cached 24 hours prior to the event (State F/G). Simultaneously, the temporal gate validity window is shrunk to 30 minutes post-generation. Legitimate pre-registered drivers presenting pre-cached passes (generated 24 hours prior) will have a timestamp that is 24 hours old. The offline scanner will read this timestamp and immediately reject the pass as expired, bricking entry for 100% of pre-registered drivers.
*   **Remediation:** 
    - Specify dual-pass lifecycle differentiation:
      1. **Pre-Arrival Passes**: Validate pre-arrival passes for the **entire active duration of the event** (e.g., 24 hours). Rely strictly on the **double-scan replay cache** (SQLite/IndexedDB buffer) to prevent duplicated passes, and the **Screenshot Evasion Guards** (visual verification of driver's name, vehicle plate, and passenger names decrypted from the pass metadata and displayed on the marshal terminal) to verify the physical rig matches the pass.
      2. **On-Demand Passes**: Restrict the 30-minute validity window exclusively to on-demand, guest/spectator passes generated at the gate via SMS or PWA offline sync.

### Gap 2: 32-Bit Truncated Hex-String Passenger Waiver Collision (Legal Waiver Bypass - HIGH)
*   **Finding:** Storing the first 8 characters of a hex-encoded SHA256 waiver hash represents only 4 bytes (32 bits) of actual hash data. Due to the birthday paradox, the collision threshold is extremely low ($2^{16} = 65,536$ trials). A driver or passenger who has NOT signed the waiver can easily brute-force different name variations (e.g., "Bob Smith", "Bob Smith ", "Bob_Smith") on a smartphone in under a millisecond to find a prefix matching a valid signed waiver of a different attendee. The offline scanner will check the prefix, find the match, and clear them, circumventing track liability.
*   **Remediation:**
    - Change the field type in the `SecurePassMetadata` protobuf message from `repeated string passenger_waiver_hashes = 10;` to `repeated bytes passenger_waiver_hashes = 10;`.
    - Store **8 bytes of raw binary** (64 bits of entropy). This takes the exact same 8 bytes of serialization overhead in Protobuf but raises the collision threshold to $2^{32} \approx 4.29$ billion trials, making brute-force collision attacks practically impossible.

### Gap 3: Missing Outer Key Identifier & Trial Verification DoS (Medium Risk)
*   **Finding:** The `SignedSecurePass` envelope contains no key identifiers, venue IDs, or public key fingerprints. During key rotations or multi-venue operations, the offline terminal has no idea which public key was used to sign the pass. It is forced to perform "trial verification" (trying every active key in its store). An attacker can flood the gate with malformed QR codes, forcing the scanner into CPU-exhausting verification loops that freeze the terminal, violating the <5-second entry SLA. (Deserializing the payload first to read the key version violates the "verify before parsing" rule, exposing the Protobuf parser to unverified binary exploits).
*   **Remediation:**
    - Add an explicit `signing_key_id` or `key_fingerprint` to the **outer** `SignedSecurePass` envelope:
      ```protobuf
      message SignedSecurePass {
        bytes serialized_metadata = 1; // Immutable raw bytes of SecurePassMetadata
        bytes ed25519_signature   = 2; // Ed25519 signature over serialized_metadata
        uint32 signing_key_id     = 3; // Identifies the correct public key immediately
      }
      ```
    - The scanner selects the correct pre-loaded public key immediately using this ID *before* parsing the untrusted payload.

### Gap 4: Browser Sandbox & Offline Sync Limits (Platform SPOF - CRITICAL)
*   **Finding:** Background peer-to-peer sync via Web Bluetooth or Web NFC is a technical impossibility. iOS Safari does not support Web NFC, and iOS disables Web Bluetooth inside PWAs and background Service Workers; foreground user interaction and active permissions are strictly required. Furthermore, iOS Safari Private/Incognito modes restrict or disable IndexedDB access, losing offline signatures. Enforcing DNS-over-HTTPS (DoH) in modern browsers will bypass local offline DNS resolvers, failing to resolve `*.local.gridpass.app` to a local IP. Lastly, storing the wildcard SSL private key on physical gate terminals exposes it to theft and subsequent high-value Man-in-the-Middle (MitM) attacks.
*   **Remediation:**
    - **Private Browsing modal**: The web app must detect Private/Incognito mode and display a high-visibility modal instructing the user to switch to standard browsing to complete the waiver.
    - **Abandon BLE/NFC for client background sync**: Rely strictly on standard local WPA3-Personal Wi-Fi network endpoints (`http://192.168.1.1/api/sync-signature`) accessed via active foreground browser fetch loops while the user has the pass open.
    - **Remove Wildcard DNS-to-IP Key Exposure**: Utilize standard, secure local HTTP routing inside password-protected, encrypted local WPA3-Personal Wi-Fi paddock networks, or localized gateway-specific self-signed certificates with a simple manual trust prompt, keeping wildcard private keys secure on cloud servers.

### Gap 5: The 30-Second Mesh Network Sync Loss & Split-Brain Duplicates (Operational Fraud - HIGH)
*   **Finding:** Diesel idling and large steel transporter rigs block Wi-Fi signals. A 30-second mesh drop threshold is too short, causing terminals to constantly drop and re-enter Isolated Mode. This triggers severe **alarm fatigue** for marshals, prompting them to bypass prompts. Furthermore, under Isolated Mode, split-brain counter caches allow attendees to scan a single verified pass screenshot at multiple gates simultaneously without triggering double-scan alerts.
*   **Remediation:**
    - Increase the mesh sync loss threshold to **3 minutes** before entering Isolated Mode.
    - Replace loud mesh drop alarms with a silent warning banner, reserving loud alarms strictly for duplicate scan checks.
    - In Isolated Mode, force scanners to require a physical confirmation tap of the matching license plate (read from the tow vehicle/trailer) before allowing manual override, ensuring visual checks are actively enforced.

### Gap 6: Solar Light Mode CSS Scoping & SVG Image Clashing (UI/Scanning Failures - HIGH)
*   **Finding:** Partner logos loaded via standard `<img>` tags are sandboxed by browsers; document-level CSS rules (`body.solar-light-mode svg`) cannot style their internal paths, leaving white SVG logos invisible against pure white backgrounds. Additionally, Solar Light Mode CSS overrides (`!important` rules) wipe out `.status-clear-glow` animations, eliminating the high-visibility "green pulse" that marshals use to verify clearance from 10 feet away.
*   **Remediation:**
    - **Inlined SVGs**: Mandate that all B2B logos and SVGs be explicitly inlined in the HTML DOM (e.g. custom React inline SVG components) rather than loaded via `<img>` tags, allowing the CSS `stroke` and `fill` rules to target their paths.
    - **Preserve Color Cues**: Adjust the Solar Light Mode overrides to enforce a thick solid green border (`border: 4px solid #10b981 !important; box-shadow: none !important;`) for active clearance cards to preserve the 10-foot visual check cue.

### Gap 7: Cryptographic Terminology Contradiction (LOW)
*   **Finding:** The specification uses the mathematically incorrect phrase "decrypt and verify" for Ed25519 signature checks. Ed25519 is a signature scheme (EdDSA); signatures are verified over raw bytes, not decrypted.
*   **Remediation:**
    - Revise terminology to "decode the outer envelope and verify the Ed25519 signature over the raw serialized metadata bytes using the pre-loaded public key."

---

## 3. Worker Gen 8 Action Plan

Worker Gen 8 M3 must apply these exact seven remediations directly to `join_conversion_ui.md` in the workspace root, run all structural checks, and verify structural syntax layout before handing back control for the final gating round.
