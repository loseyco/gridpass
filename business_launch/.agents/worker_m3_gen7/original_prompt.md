## 2026-05-22T16:09:51Z
You are Worker Gen 7 M3.
Your working directory is: c:\_Projects\Gridpass-v4\business_launch\.agents\worker_m3_gen7.

Your core mission is to fully remediate the landing experience specification document `c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md` to resolve all 9 remaining architectural, cryptographic, styling, and platform gaps from the Round 4 Synthesis Report, AND incorporate the owner's locked-in decisions regarding vehicle lookups, gate auth, waiver integration, and dynamic Pro monetization.

Please apply the following changes directly to `c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md`:

### 1. The 9 UX and Architectural Gaps (Round 4 Synthesis)
- **Gap 1 (SW Sandbox SSL Bypass):** Completely remove all references to browser-level custom CA certificate pinning inside the Service Worker. In its place, specify a publicly trusted DNS-to-private-IP architecture (e.g. mapping public wildcard subdomains like `*.local.gridpass.app` to local gateway private IPs like `192.168.1.50` with trusted Let's Encrypt certificates), or standard secure HTTP routing strictly inside password-protected, encrypted local WPA3-Personal Wi-Fi paddock networks.
- **Gap 2 (iOS Safari BLE/NFC Compatibility):** Abandon active Web Bluetooth and Web NFC connection requirements for client-side devices. Rely strictly on standard REST fetches over local Wi-Fi networks (e.g., `http://192.168.1.1/api/sync-signature`) to sync signatures and check-ins. Explicitly leverage native Apple Wallet Pass `.pkpass` templates which natively support lockscreen BLE/NFC triggers and display the offline-scannable 2D QR pass.
- **Gap 3 (Captive Portal CNA Isolation):** In the dynamic welcome screens (State B) and journey maps, specify prominent warning micro-copy and visual instructions directing drivers to bypass the Captive Network Assistant (CNA) browser window and manually open their native Safari/Chrome app to complete onboarding, ensuring storage consistency.
- **Gap 4 (Screenshot Evasion Guards):** Enrich the inner `SecurePassMetadata` protobuf message with driver legal name, tow vehicle plate, and passenger names:
  ```protobuf
  message SecurePassMetadata {
    // Existing fields...
    string driver_legal_name = 12;      // Legal name (max 24 characters) for offline ID verification
    string tow_vehicle_plate = 13;      // Primary tow vehicle license plate (max 8 characters)
    repeated string passenger_names = 14; // Legal names of all verified checked-in passengers
  }
  ```
  Specify that the offline marshal terminal decrypts and displays these fields, allowing the marshal to visually verify physical plates and spot-check government IDs.
- **Gap 5 (Split-Brain Mesh Replays):** Shrink the temporal gate validity window from 4 hours to **30 minutes** post-generation. When the gate scanner drops mesh sync (>30s) and enters Isolated Mode, it must trigger a prominent orange **"ISOLATED - VERIFY VEHICLE DETAILS"** screen, making visual license plate and rig checks a hard-blocked interactive prompt.
- **Gap 6 (Solar Light Mode Clashing):** Explicitly exclude the QR barcode container, barcode images, and signature drawing canvas from any global CSS brightness/inversion filters using `:not()` selectors. Mandate that co-branded B2B assets be uploaded as vector SVGs with semantic classes (`.logo-fill`, `.logo-stroke`) rather than raster PNGs, and spec contrast-preserving masks if raster PNGs are used.
- **Gap 7 (Offline Windshield Decal Auditing):** Spec that windshield QR decals encode a compact `SignedSecurePass` representing the vehicle's tech certification and driver waiver status, which marshal scanners can decrypt locally using pre-loaded public keys.
- **Gap 8 (Flash of Dark Theme Mitigation):** Spec a blocking inline script in the document `<head>` that parses `localStorage` override keys and injects the `.solar-light-mode` class *prior* to CSS rendering or React hydration to prevent FODT.
- **Gap 9 (GPS Geofence & Max Brightness UI):** Clarify that GPS is a soft geofence backed by hard marshal lane blocks, and add high-visibility user-facing copy on the clearance screen to prompt users to manually max out screen brightness and angle displays.

### 2. The Owner's Locked-in Decisions (Interlock Feed)
- **Stripe Connect & Split-Billing Integration:** High-level architectural note linking to the detailed specification compiled by the Financial AI Agent.
- **Vehicle Passport & Gate Camera Scanning:** Incorporate specifications for free plate/VIN lookup APIs to auto-fill vehicle profiles during declaration (State D) and gate camera OCR scanner mechanics for automatic check-in in the gate layouts.
- **Gate Operator Auth & Verification:** Add a dual-mode operator authentication logic into the gate-operator UI specifications:
  1. A secure "Gate Operator" PIN overlay for manual check-in actions at high-security venues (e.g. NASCAR).
  2. A low-friction public confirmation view displaying waiver and registration status for low-security environments (e.g. offroad parks). If a visitor lacks a waiver or registration, display a prominent warning and route them to complete it.
- **Digital Waiver Management:** Design a dual-integration architecture: support external third-party digital waiver systems (e.g. SmartWaiver verification tokens) alongside our native basic e-sign template system built directly in Gridpass.
- **Gridpass Pro & Monetization Strategy:** Spec an a-la-carte add-on model where drivers purchase premium items (such as high-quality physical metallic QR tags shipped to their door, premium garage design options) individually, avoiding rigid monthly Pro subscriptions.
