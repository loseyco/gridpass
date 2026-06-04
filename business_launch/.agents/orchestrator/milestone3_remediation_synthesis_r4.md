# Milestone 3 Gating Verification Remediation Synthesis Report (Round 4)

This report consolidates, reconciles, and synthesizes the findings and action items from the five independent gating verification subagents in the fourth gating round (Reviewer 1 Gen 4, Reviewer 2 Gen 4, Challenger 1 Gen 4, Challenger 2 Gen 4, and the Forensic Auditor Gen 5) who evaluated the Landing Experience UX Specification (`join_conversion_ui.md`) for Milestone 3.

---

## 1. Catalog of Inputs & Subagent Status

| Agent ID | Role | Focus | Verdict | Confidence | Key Artifacts |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `91a751fb-3549-47b9-a097-ee82864839ef` | Reviewer 1 Gen 4 | HSL brand variable overrides, mobile viewports | **APPROVED** | 98% (High) | `review.md`, `handoff.md` |
| `ec10777d-be41-4abb-b0ef-b9c12315c0e4` | Reviewer 2 Gen 4 | Fitts's Law touch target height, manual Sensor overrides | **APPROVED WITH CONDITION** | 98% (High) | `review.md`, `handoff.md` |
| `5e33c0d1-1026-430d-ac69-817115eb8688` | Challenger 1 Gen 4 | Protobuf SignedSecurePass, passenger waiver evasion | **BLOCKED (VETO)** | 100% (Very High) | `challenge.md`, `handoff.md` |
| `54382a36-20ce-4d7a-a860-d9a7fd737411` | Challenger 2 Gen 4 | SW sandbox CA pinning, PWA local storage, Solar light | **BLOCKED (VETO)** | 100% (Very High) | `challenge.md`, `handoff.md` |
| `4ebf3861-def7-4c45-943a-cddc1e279ff0` | Forensic Auditor Gen 5 | Schema standardizations, visual/technical compliance | **CLEAN (PASSED)** | 100% (Absolute) | `audit.md`, `handoff.md` |

**Verification Gate Result:** 🔴 **FAIL**. Although Reviewer 1 APPROVED, Reviewer 2 approved with conditions, and the Forensic Auditor returned a CLEAN audit, the gate is blocked by critical architectural, cryptographic, platform, and security exploits identified by Challenger 1 and Challenger 2. A final, comprehensive remediation loop (Worker Gen 7 M3) is required to resolve these remaining gaps in `join_conversion_ui.md`.

---

## 2. Remaining Blocker Gaps (For Worker Gen 7 Remediation)

We have consolidated the blocker gaps that must be resolved in `join_conversion_ui.md` to achieve full approval:

### Gap 1: PWA Service Worker CA Pinning Security Sandbox Violation (Architectural SPOF)
*   **Finding:** The claim that Progressive Web App (PWA) Service Workers can programmatically pin custom CA certificates inside mobile browsers (Safari/Chrome) to bypass local HTTPS warnings is a web security sandbox violation. Browser engines handle TLS handshakes at the native OS/engine level; Service Workers have **zero access** to TLS sockets or OS root stores. A self-signed local gateway certificate will trigger a hard, un-bypassable red warning screen (**"Connection is Not Private"**) that blocks the PWA from executing or loading pre-cached assets.
*   **Remediation:** 
    - Completely remove all specifications regarding browser sandbox custom CA certificate pinning inside the Service Worker.
    - Specify a **publicly trusted DNS-to-private-IP architecture**: map a public wildcard DNS subdomain (e.g., `*.local.gridpass.app`) to the local gateway's private IP (e.g., `192.168.1.50`) and load a standard, publicly trusted wildcard SSL/TLS certificate (e.g., Let's Encrypt) directly onto the local gate gateway.
    - Alternatively, permit standard un-encrypted HTTP routing strictly inside password-protected, encrypted local WPA3-Personal Wi-Fi paddock networks.

### Gap 2: iOS Platform Web NFC/Bluetooth Incompatibilities (Platform SPOF)
*   **Finding:** Over 50–80% of active automotive enthusiasts run iOS. iOS Safari **does not support the Web NFC API at all**, and **Web Bluetooth is completely disabled** by default in iOS Safari and iOS PWAs. Relying on active browser BLE/NFC APIs for offline sync will fail 100% of the time on iOS devices, locking out paddock lines.
*   **Remediation:**
    - Abandon browser-level active Web Bluetooth and Web NFC connection requirements for client-side devices.
    - Rely strictly on standard REST fetches over local Wi-Fi networks (e.g., `http://192.168.1.1/api/sync-signature`) to sync local signatures and passes.
    - Explicitly leverage native Apple Wallet Pass `.pkpass` bundles, which natively support lock-screen BLE/NFC triggers and display the high-contrast 2D offline-scannable QR pass.

### Gap 3: Captive Network Assistant (CNA) Viewport Sandbox Storage Isolation (Data Loss SPOF)
*   **Finding:** Mobile operating systems hijack local Wi-Fi connections to automatically open a stripped-down Captive Network Assistant (CNA) browser window. This CNA sandbox is highly restricted and does *not* share Service Worker caches, cookies, or IndexedDB storage with the user's primary Safari/Chrome instance, isolating pre-cached assets and offline check-in signatures.
*   **Remediation:**
    - Add prominent warning micro-copy and instructions on the dynamic welcome screen directing drivers to bypass the CNA popup or manually open their standard, native browser application (Safari/Chrome) to complete onboarding.

### Gap 4: Pass Identity Omissions in Cryptographic Payload (Screenshot Evasion Exploit)
*   **Finding:** The inner `SecurePassMetadata` protobuf schema completely omits the driver's legal name, primary vehicle license plate, and passenger names. Offline marshal terminals can verify the Ed25519 signature but cannot match the physical presenter or vehicle to the pass, enabling seamless gate-bypass via shared QR screenshots.
*   **Remediation:**
    - Enrich the inner `SecurePassMetadata` protobuf message with explicit identity-matching fields:
      ```protobuf
      message SecurePassMetadata {
        // Existing fields...
        string driver_legal_name = 12;      // Legal name (max 24 characters) for offline ID verification
        string tow_vehicle_plate = 13;      // Primary tow vehicle license plate (max 8 characters)
        repeated string passenger_names = 14; // Legal names of all verified checked-in passengers
      }
      ```
    - Document a process where the offline terminal displays these decrypted fields, allowing marshals to visually match the physical vehicle's license plate and spot-check government IDs.

### Gap 5: Split-Brain Mesh Partition Screenshot Replay Exploits (Operational Fraud)
*   **Finding:** When the Wi-Fi mesh sync drops, scanners enter Isolated Mode. Attendees can screenshot a single paid check-in pass (valid for 4 hours) and simultaneously scan it at multiple isolated gates without triggering double-scan alerts, particularly for standard vehicles with null trailer plates.
*   **Remediation:**
    - Tighten the temporal gate validity window from 4 hours to **30 minutes** post-generation.
    - Specify that when a scanner enters Isolated Mode, it triggers a prominent orange **"ISOLATED - VERIFY VEHICLE DETAILS"** screen, making visual plate and rig comparison a hard-blocked interactive prompt rather than a passive banner.

### Gap 6: Solar Light Mode Graphic Clashes & QR Code Inversion (Scanning Failures)
*   **Finding:** Global page inversion filters in Solar Light Mode turn raster B2B co-branded PNG logos with solid backgrounds into unreadable, solid black boxes. Furthermore, inverting high-contrast elements can invert the QR barcode blocks (swapping black and white modules), which standard industrial hardware scanner modules struggle to decode under direct sunlight.
*   **Remediation:**
    - Enforce that co-branded B2B assets must be uploaded as vector SVGs with semantic classes (`.logo-fill`, `.logo-stroke`) rather than raster PNGs.
    - If raster PNGs must be supported, enforce transparent backgrounds and use specific CSS filters (`filter: grayscale(1) contrast(1000%) invert(1)`).
    - Explicitly exclude the QR barcode container, standard barcode images, and drawing canvas elements from any global CSS brightness/inversion filters using `:not()` selectors (e.g. `body.solar-light-mode img:not(.qr-barcode)`).

### Gap 7: Offline Windshield Decal Audit Failure (Offline Auditing Loophole)
*   **Finding:** Locking public windshield QR code scans behind server-side geofencing or member authentication fails 100% of the time in rural paddock cellular dead zones, blocking paddock marshals from auditing parked cars offline.
*   **Remediation:**
    - Allow offline windshield QR code verification by specifying that the windshield QR decal encodes a compact `SignedSecurePass` representing the vehicle's tech certification and driver waiver status. Scanners can decrypt it locally using pre-loaded public keys.

### Gap 8: Flash of Dark Theme (FODT) Glare Blindness (UI Glitch Condition)
*   **Finding:** In 10,000+ nits of direct sun glare, users experience temporary visual blindness if there is a delay between page load and theme application, causing a "Flash of Dark Theme" (FODT) during React hydration.
*   **Remediation:**
    - Implement a blocking inline head script in the document `<head>` that parses `localStorage` or `indexedDB` override keys and injects the `.solar-light-mode` class *prior* to CSS rendering or React hydration.

### Gap 9: GPS Geofence Lane Precision & Screen Brightness Copy (Scan Speed Optimization)
*   **Finding:** Smartphone GPS accuracy (3–5m margins) overlaps adjacent gate lanes, meaning geofencing is a soft deterrent. Additionally, scan speeds suffer if user device screens are not at maximum brightness.
*   **Remediation:**
    - Add a technical note in the specification clarifying that geofencing is a soft deterrent backed up by hard marshal lane gate blocks.
    - Add high-visibility user-facing copy to the clearance screen prompting users to manually max out device screen brightness and angle displays away from direct sunlight for scanning.

---

## 3. Worker Gen 7 Action Plan

Worker Gen 7 must apply these exact nine remediations directly to `join_conversion_ui.md` in the workspace root, run all structural checks, and verify structural syntax layout before handing back control for the final gating round.
