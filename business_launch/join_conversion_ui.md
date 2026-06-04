# Gridpass Join Conversion UI & Architecture Specification
**Optimizing Physical-to-Digital Conversion Rates via High-Impact QR Ingress Systems**

---

## 1. Executive Summary

### The Physical Gate Bottleneck
In the automotive enthusiast ecosystem, physical event gates are the ultimate operational choke point. On Saturday mornings between 6:30 AM and 8:00 AM, racing circuits, offroad parks, and enthusiast meets experience severe congestion. Vehicles towing large rigs back up onto public access roads, while gate staff pass wet-ink clipboard waivers and printed Excel spreadsheets out of booth windows. 

This legacy process creates public safety hazards, increases staff labor costs, delays driver meetings, and causes high drop-off for digital check-ins. Traditional digital check-ins fail because they redirect mobile users to slow, multi-step email authentication loops that get killed by mobile browsers in weak cell-service environments.

### The Gridpass "One-Scan" Solution
Gridpass replaces legacy paper check-ins with a "One-Scan" digital gate ingress system. By deploying physical QR codes on paddock gate banners and vehicle windshield decals, we capture drivers directly within their active `/join` webview. 

Our core architectural target is to **reduce vehicle check-in time from 180 seconds to under 5 seconds**, while maintaining 100% legal waiver compliance and high-trust lead generation.

```
       LEGACY INGRESS (180s)                  GRIDPASS INGRESS (< 5s)
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│ • Queue backups onto highways   │     │ • Pre-arrival Wallet pass download│
│ • Wet-ink paper clipboards      │ ──> │ • 10-foot visual marshal clearance│
│ • Manual spreadsheet lookups    │     │ • Multi-asset Rig & Tow OCR      │
│ • Multi-app email auth drop-out │     │ • Unified Firestore waiver signature│
└─────────────────────────────────┘     └─────────────────────────────────┘
```

### Strategic Trojan Horse Growth Engine
The physical check-in is not merely an operational hurdle; it is a high-value growth funnel. By requiring digital check-ins, we transition anonymous drivers into Gridpass members:
1. **SMS OTP Authentication**: Eliminates email loops, keeping the driver inside the webview and preventing background browser tab purging.
2. **Dynamic Co-Branded Welcome Screens**: Custom CSS variables dynamically inject B2B venue branding, preserving native dark glassmorphic styles while instantly establishing venue trust.
3. **Rig & Tow Cargo Declarations**: Solves multi-vehicle onboarding through single-tap grids and camera-based license plate OCR.
4. **Ambient Geofenced Wallet Passes**: Places offline-capable passes directly in Apple and Google Wallet, triggering lock-screen notifications as vehicles approach gate coordinates.
5. **Gamified Digital Garages**: Seamlessly transitions gate clearance into paddock bragging rights via verified spec registries, leaderboards, and peer-voting.

---

## 2. B2C Towing Onboarding Journey Map

To guide a driver towing a multi-asset rig at a busy gate from scanning to gate clearance, the UX cycles through a series of robust, state-preserving transitions.

### Ingress State-Transition Diagram
```
[State A: Resolver Loading] 
      │
      ▼ (Tag resolved as gate/paddock point)
[State B: Paddock Welcome (Scanning Guest)]
      │
      ├─────────────────────────────────────────┐
      ▼ (Taps SMS Check-in)                     ▼ (Taps Google/Apple Auth)
[State C: SMS OTP Verification]                 │
      │                                         │
      ▼ (Verification Success)                  │
[State D: Vehicle & Trailer Declaration] <──────┘
      │
      ▼ (Assets Selected / Plate Scanned)
[State E: Liability Waiver Signature]
      │
      ▼ (Waiver Signed / Approved)
[State F: Gate Clearance (Active Session)]
      │
      ▼ (Taps Add to Wallet / Internet Drops)
[State G: Offline Active Pass (Wallet)]
```

### Detailed State Definitions

#### State A: Resolver Loading
*   **UI Display & Core Elements**: Animated Gridpass telemetry spinner, "Syncing Gridpass Network...", and a non-blocking prompt requesting geolocation permissions.
*   **User Action / Trigger**: Dynamic landing on `/join?id=XXXX` via scanning a physical QR code.
*   **Backend & DB Events**: Resolves the `tagId` via the `/api/resolve-tag` endpoint. Telemetry is logged to `tag_scans` capturing IP-resolved geo-coordinates, user-agent, and scan time.
*   **Transition Rules**: If the tag is linked to an active user/vehicle profile, redirect instantly. If it is a venue gate check-in or unclaimed tag, transition to **State B**.

#### State B: Paddock Welcome (Scanning Guest)
*   **UI Display & Core Elements**: Localized welcome badge displaying the venue name and logo. Renders a clear progress tracker ("Step 1 of 3: Verification"), "Quick SMS Check-in" primary input, and discrete secondary Apple/Google OAuth CTAs.
    *   **CNA Isolation Warning Banner**: Renders prominent warning micro-copy and visual instructions directing drivers to bypass the Captive Network Assistant (CNA) browser window and manually open their native Safari/Chrome app to complete onboarding, ensuring storage consistency.
    *   *Warning Copy*: *"⚠️ Captive browser window detected. To guarantee storage consistency and complete registration, tap the browser icon in the top-right corner to exit this Captive Network Assistant and open this page in your native Safari or Chrome app."*
*   **User Action / Trigger**: User inputs their phone number and taps "Send Gate Code via SMS", or selects a social login.
*   **Backend & DB Events**: If SMS is chosen, the server triggers a background OTP generation event, dispatching a 4-digit code via the SMS gateway (e.g. Twilio API).
*   **Transition Rules**: Move to **State C** on SMS click; move directly to **State D** if social authentication succeeds.

#### State C: SMS OTP Verification
*   **UI Display & Core Elements**: Four high-contrast numeric input fields with auto-focus and virtual numeric keyboard triggers. Displays a 60-second resend countdown timer and an active verification overlay.
*   **User Action / Trigger**: User inputs the received 4-digit OTP.
*   **Backend & DB Events**: Submits OTP to the auth resolver. If valid, queries the Firestore `users` collection to check if the profile exists. If new, creates a skeletal `users` record.
*   **Transition Rules**: On verification success, transition to **State D**. If expired or incorrect, show high-contrast error states and reset inputs. If OTP delivery fails, a spectator-only bypass link is provided under strict controls.

##### Spectator Bypass Guards & Vehicle Lane Lockouts
To prevent active drivers or vehicle rigs from circumventing mandatory legal liability waivers and safety technical sheets via the spectator bypass path during cellular latency or OTP delivery failure, the following controls are strictly enforced:
*   **Strict Lane Isolation & Active Lane Lockouts**: Spectator bypass links are geofenced and disabled in active vehicle/towing lanes. They are restricted exclusively to designated walk-in pedestrian gates. Marshal scanning app terminals are hard-coded to block spectator passes in vehicle ingress lanes.
*   **Active Hard Lockout Trigger**: If a spectator pass is scanned on a gate terminal assigned to a vehicle/towing ingress lane, the scanning terminal must trigger a persistent, loud audible alarm, continuous haptic vibration, and a full-screen block displaying the high-visibility warning: **BLOCKED: SPECTATOR PASS IN VEHICLE LANE**. This completely halts the queue until the marshal manually rejects the pass or redirects the vehicle.
*   **Complete Schema Field Omission**: Spectator passes completely omit all vehicle and technical/inspection fields. Specifically, `vehicleContext`, `towVehicleType`, `towVehiclePlate`, `trailerType`, and `trailerPlate` are set to null or completely excluded from both the JSON API response and the binary `SecurePassMetadata` Protobuf payload. Furthermore, the vehicle technical/inspection status is managed solely through the driver's registration profile in Firestore and is not serialized into the compact binary pass payload (except where run groups implicitly segregate classes). This prevents a spectatorship pass from masquerading as a driver check-in.
*   **Manual ID Checks**: All guest passes generated through the spectator bypass path are flagged with an unverified token and require manual, physical government-issued ID checks by the gate marshal.
*   **Orange Layout for Bypassed Sessions**: Unverified bypassed guest sessions must not display the green active clearance UI. The UI is forced into a distinct orange layout displaying **UNVERIFIED SPECTATOR - HOLD FOR MANUAL ID CHECK**.


#### State D: Vehicle & Trailer Declaration (The "Rig & Tow" Matrix)
*   **UI Display & Core Elements**: Multi-asset grid selectors. 
    *   *Row 1 (Tow Vehicle)*: Pickup Truck, SUV, Commercial/Rig, None.
    *   *Row 2 (Trailer Type)*: None, Flatbed, Enclosed.
    *   *Row 3 (Track Asset)*: HPDE/Race Car, Off-Road OHV, Dirt Bike.
    *   *OCR Trigger*: "Scan License Plate / VIN Camera OCR" button.
    *   *Auto-Fill Lookup API*: Free plate/VIN lookup APIs. Inputting a plate or VIN automatically queries these APIs to fetch and pre-populate vehicle specifications (Year, Make, Model, Trim, Weight) into the active profile.
    *   *Gate Camera OCR Scanner Integration*: Ingress lane camera OCR captures plates on entry and automatically resolves/updates registrations.
    *   *Solar Light Mode*: A glove-friendly header toggle switches the theme to high-density pure white (`#ffffff`) background and pitch black (`#000000`) text, maximizing contrast under high solar glare (10,000+ nits).
*   **User Action / Trigger**: User taps their rig configuration. Optionally taps the OCR button to open the webview camera stream, capturing their trailer's license plate, or inputs their plate/VIN for specification auto-fill.
*   **Backend & DB Events**: Fully writes the declared rig combination (`tow_vehicle_type`, `trailer_type`, and scanned/OCR'd `tow_vehicle_plate`) to the Firestore `registrations` collection to prevent data loss. Auto-fills specs from the lookup APIs. If OCR is utilized, client-side canvas processing extracts the plate text to populate these fields. This enables visual gate matching by marshals checking in the driver's tow vehicle and trailer configurations.
*   **Transition Rules**: User taps "Proceed to Waiver" to transition to **State E**.

#### State E: Liability Waiver Signature & Dual-Integration Architecture
*   **UI Display & Core Elements**: Consolidated, bulleted high-impact legal summaries. Scrollable full-text waiver container. Signature drawing canvas with clear "Clear" and "Accept & Sign" touch zones.
    *   **Dual-Integration Digital Waiver Options**: The UI supports both our native basic e-sign template system and external third-party digital waiver systems (e.g. SmartWaiver verification tokens). If a third-party waiver is detected/required, the UI displays a secure verification token login or redirect, rather than the drawing canvas.
*   **User Action / Trigger**: User scrolls to verify reading, draws their signature, or completes third-party SmartWaiver verification, then taps "Sign & Get Pass".
*   **Backend & DB Events**: For native signatures, hashes the digital signature along with the user's IP, timestamp, and a salt to generate `signature_hash`. Captures the full physical signature vector stroke coordinates as an SVG path or stroke coordinate array (`signature_strokes`) and saves a generated PNG image to Cloud Storage (`signature_image_url`). For third-party waivers, validates and records the external verification token. Writes this comprehensive record to the `waiver_signatures` collection and marks `waiver_signed: true` in the active `registrations` document, ensuring 100% legal compliance.
*   **Waiver Custody, Offline Persistence & Sandbox Remediations**: During cellular dead zones or Firestore timeouts, the client MUST NOT attempt to host interactive signature canvases or complete new waiver signings on local Captive Network Assistant (CNA) browser viewports. Stripped-down CNA browsers completely lack IndexedDB and Canvas support, which will break the signature process and trigger untrusted HTTPS/SSL certificate warnings.
    *   **Private Browsing Modal**: iOS Safari and other modern browsers in Private/Incognito modes restrict or disable IndexedDB access completely, losing offline signatures. The web application must actively detect Private/Incognito mode and display a high-visibility, blocking modal instructing the user to switch to standard browsing to complete the waiver and ensure local offline data integrity.
    *   **Abandon background BLE/NFC sync**: Background peer-to-peer synchronization via Web Bluetooth or Web NFC is a technical impossibility in standard browser sandboxes, as iOS Safari blocks Web NFC entirely and disables Web Bluetooth inside PWAs and background Service Workers. The system completely abandons background BLE/NFC client sync. Instead, the application relies strictly on standard local WPA3-Personal Wi-Fi network endpoints (`http://192.168.1.1/api/sync-signature`) accessed via active foreground browser fetch loops while the user has the pass open in their browser.
    *   **Remove Wildcard DNS-to-IP Key Exposure**: Storing a publicly trusted wildcard SSL/TLS certificate's private key directly on physical paddock gate terminals or localized gate routers is strictly forbidden to prevent physical extraction and catastrophic Man-in-the-Middle (MitM) compromise. Furthermore, modern browsers that enforce DNS-over-HTTPS (DoH) will bypass local offline DNS resolvers, preventing resolution of subdomains like `*.local.gridpass.app` to a local IP. The system completely avoids wildcard DNS-to-IP configurations. Instead, the local offline gateway architecture must utilize either: (1) localized, gateway-specific self-signed certificates with a simple manual trust prompt on the driver's native browser to establish secure HTTPS, or (2) secure, un-encrypted local HTTP routing restricted strictly inside password-protected, encrypted local WPA3-Personal Wi-Fi paddock networks. Wildcard private keys must remain securely locked in cloud HSM/KMS environments. Active foreground browser fetch loops target the raw gateway IP address directly (`http://192.168.1.1/api/sync-signature`), circumventing DoH name-resolution bottlenecks.
*   **Transition Rules**: Transition immediately to **State F** upon successful local IndexedDB write and background sync queue registration.


#### State F: Gate Clearance (Active Session)
*   **UI Display & Core Elements**: Ambient screen color shifts to deep emerald green with high-contrast text: **CLEARED — PASS ACTIVE**. Renders a bright, high-definition 2D QR barcode, digital garage preview, and official Apple and Google Wallet badge elements.
    *   **Max Brightness Prompt**: Displays prominent high-visibility user-facing copy on the clearance screen directing the driver: *"☀️ FOR INSTANT SCANNING: Please manually maximize your screen brightness and angle your screen directly towards the marshal's scanner."*
    *   **GPS Soft Geofence Backed by Hard Lane Blocks**: Displays warning: *"GPS is a soft geofence. Hard marshal lane blocks are active; present this pass to the gate marshal for scanning."*
*   **User Action / Trigger**: User presents the browser screen to the gate marshal or taps the wallet badges.
*   **Backend & DB Events (Dual-Pass Lifecycle Differentiation)**: Marks `check_in_status` as `checked_in` in the `registrations` collection. Compiles the custom Apple PassKit `.pkpass` bundle containing location coordinates, theme styles, and the asymmetric `cryptographic_signature`. To bypass dynamic server-side signing CPU bottlenecks at peak times, the system enforces a strict dual-pass lifecycle:
    *   **Pre-Arrival Passes**: Pre-registered driver passes are pre-generated 24 hours prior and cached globally on edge CDNs (served in <100ms). These passes are validated for the **entire active duration of the event** (e.g., 24 hours). The offline scanner relies strictly on the **double-scan replay cache** (local SQLite/IndexedDB buffer) to prevent duplicates, and the **Screenshot Evasion Guards** (visual verification of driver's name, vehicle plate, and passenger names decoded from the pass metadata and displayed on the marshal's screen) to verify that the physical towing rig and passengers match the pass.
    *   **On-Demand Passes**: Guest and spectator passes generated at the gate via SMS or PWA offline sync are restricted to a strict **30-minute** validity window post-generation to prevent reuse.
*   **Transition Rules**: Triggers the OS native wallet prompt, leading to **State G**.

#### State G: Offline Active Pass (Wallet)
*   **UI Display & Core Elements**: Native iOS/Android lock-screen wallet pass. Shows the track gate entry lane, dynamic event schedule times, and a persistent offline-readable QR pass.
*   **User Action / Trigger**: Driver approaches the paddock gate; the pass wakes up on the lock screen via native lockscreen geofencing or native NFC/Bluetooth Beacon proximity triggers (supported natively by Apple and Google Wallet passes). Marshal scans the pass offline. Active background BLE/NFC client sync is completely abandoned due to browser sandbox restrictions; passes and signatures synchronize strictly via standard local WPA3-Personal Wi-Fi network endpoints (`http://192.168.1.1/api/sync-signature`) accessed via active foreground browser fetch loops while the user has the pass open in their browser.
*   **Backend & DB Events**: Gate scanner decodes the outer `SignedSecurePass` envelope and verifies the Ed25519 signature over the raw serialized metadata bytes (`serialized_metadata`) using the pre-loaded public key immediately identified by the `signing_key_id` in the outer envelope. This instantly maps the correct public key, completely preventing slow trial verifications or CPU-exhausting trial verification Denial of Service (DoS) attacks under key rotation, and protecting the parser from binary exploits by verifying the signature *before* parsing the untrusted payload. The scanner then parses the payload into `SecurePassMetadata` to extract registration details and enforces the dual-pass lifecycle (entire event duration for pre-arrival passes verified by replay cache + screenshot evasion guards, vs. strict 30-minute validity post-generation for on-demand passes), caching the scan event for eventual Firestore sync. This enables secure, local verification without requiring active WAN database lookups or cellular signals.
*   **Windshield Decal Security, Geofencing & Offline Decal Auditing**: Public scanning of vehicle windshield QR decals is locked behind strict geofencing checks or strict member-verification requirements (requiring the scanner to be an authenticated user checked into the event). This prevents paddock reconnaissance and high-value asset targeting by paddock thieves. To guarantee integrity, geofencing checks must be performed server-side using IP-resolved coordinates or cryptographically signed local gate marshal terminal coordinates rather than raw client-supplied latitude/longitude query parameters.
    *   **Windshield QR Decal Offline Auditing**: Windshield QR decals encode a compact, digitally signed binary `SignedSecurePass` representing the vehicle's tech certification and driver waiver status. Marshal scanners verify these decals locally by decoding the outer envelope and verifying the Ed25519 signature over the raw serialized metadata bytes using the correct pre-loaded public key immediately selected via the outer `signing_key_id`, enabling secure, local verification without active network connections or slow trial verifications.

### Journey Map Transition Table & Edge Cases

| **A: Loading** | Mesh-glow spinner, geolocation prompt. | Land on `/join?id=XXXX` | Telemetry logged to `tag_scans`. | **No GPS / Denied**: Timeout query in 3s; fallback to manual venue selection without blocking UI. Enable Solar Light Mode toggle. **FODT Mitigation**: A blocking inline script in the document `<head>` parses `localStorage` overrides and injects the `.solar-light-mode` class *prior* to CSS rendering or React hydration to prevent flash of dark theme. |
| **B: Welcome** | Venue logo, SMS input, OAuth buttons, CNA warning badge. | Inputs phone number / selects social. | If SMS, dispatch OTP. | **Weak Cell signal**: Render simplified static page, bypass heavy logo downloads. Prominently display pre-arrival caching CTA. **Captive Network Assistant (CNA) Isolation**: Detect CNA browser and display warning copy directing users to bypass CNA and manually open native Safari/Chrome app to guarantee storage consistency. |
| **C: OTP** | 4-digit code inputs, countdown. | User enters 4 digits. | Verify OTP, create/retrieve user. | **OTP Delayed**: Display manual bypass link for spectators. **Spectator Bypass Guard**: Prevent active drivers/rigs from circumventing legal waivers. Enforce strict lane isolation rules (block bypass in vehicle lanes), require manual government ID checks for bypassed guest passes, and display a distinct orange layout for bypassed unverified sessions. |
| **D: Rig Select** | Multi-asset grid, plate/VIN auto-fill, Camera OCR button. | User taps rig specs / scans plate / VIN lookup. | Store asset config in `registrations` Firestore. Query plate/VIN lookup APIs. | **Camera Permission Denied**: Disable OCR button instantly, transition to simple text input box. **Auto-fill**: Leverage free plate/VIN lookup APIs to auto-fill vehicle specifications, reducing manual gate input. **Gate Camera OCR**: Use gate cameras to scan plates and automate check-ins. |
| **E: Waiver** | Legalese bullets, canvas signature / SmartWaiver token option. | Draws signature, taps Accept, or registers SmartWaiver. | Capture `signature_strokes` and `signature_image_url` or verify SmartWaiver token. | **Firestore Timeout / Dead Zone**: Do not host signature canvases on stripped CNA browser frames. Pre-cache PWA assets 24h prior. iOS Private/Incognito browsing mode is actively detected and displays a high-visibility modal instructing user to switch to standard browsing to complete the waiver. Store signatures offline in IndexedDB. Sync via Web Bluetooth and Web NFC is completely abandoned due to iOS sandbox limits; synchronization is achieved strictly via standard local gateway REST endpoints (`http://192.168.1.1/api/sync-signature`) accessed via active foreground browser fetch loops while the pass is open. **Remove Wildcard DNS-to-IP Key Exposure**: Storing a publicly trusted wildcard private key directly on physical paddock gate terminals or localized gate routers is strictly forbidden. Instead, the local offline gateway architecture must utilize either localized, gateway-specific self-signed certificates with a simple manual trust prompt on the driver's native browser, or secure, un-encrypted local HTTP routing restricted strictly inside password-protected, encrypted local WPA3-Personal Wi-Fi paddock networks. Wildcard private keys must remain securely locked in cloud HSM/KMS environments, completely eliminating MitM vulnerabilities and DNS-over-HTTPS (DoH) resolver lookup failures. |
| **F: Clearance** | Emerald Green screen, Wallet badges, max brightness prompt. | Shows screen to marshal, taps Wallet. | Generate `.pkpass` bundle with `cryptographic_signature`. | **Attendant Scanner Offline**: Server-signed asymmetric cryptographic signature (Ed25519) embedded in 2D QR code. Enforce dual-pass lifecycle: Pre-arrival passes are pre-generated 24h prior to prevent dynamic signing bottlenecks, valid for the entire active event duration, verified via double-scan replay caches and Screenshot Evasion Guards. On-demand passes strictly expire after 30 minutes post-generation. To prevent vibration mis-taps in high-vibration paddock environments, Scenario A touch targets/buttons are designed with a minimum of 20px vertical spacing/margins. **Max Brightness**: Explicitly prompt users on-screen to manually max out screen brightness and angle displays. **GPS Geofence**: Soft geofence backed by hard marshal lane blocks. |
| **G: Offline Pass**| Native OS Lock-screen Wallet Pass. | Approaches gate, displays pass. | Eventual sync of offline scans. | **Cell Signal Dead**: Wallet pass remains 100% functional offline. Native Apple/Google Wallet Pass templates support lockscreen NFC/BLE triggers to automatically display the high-contrast offline-scannable 2D QR pass. Background BLE/NFC client sync is abandoned; signatures and passes sync strictly via standard local gateway Wi-Fi REST endpoints (`http://192.168.1.1/api/sync-signature`) accessed via active foreground browser fetch loops. Gate scanner instantly identifies correct public key using the outer `signing_key_id` to decode the envelope and verify the Ed25519 signature over raw serialized bytes, preventing trial verification DoS. **Dual-Pass Lifecycle**: Pre-arrival passes are valid for the entire event duration (e.g. 24h) backed by double-scan replay caches and Screenshot Evasion Guards (visual checks of matching names/license plates decoded on marshal's terminal). On-demand passes strictly expire after 30 minutes post-generation. **Windshield Decal Auditing**: Decals encode a compact `SignedSecurePass` verified locally over raw bytes using pre-loaded public keys. Enforce windshield security geofencing (server-side using IP-resolved coordinates or signed marshal coordinates) to prevent paddock theft reconnaissance. |

---

## 3. Visual Co-Branding Variable Model & CSS Overlay Definitions

To achieve performant, high-trust B2B2C personalization, the Gridpass codebase utilizes dynamic CSS Custom Properties. The styling system injects variables directly into the document root based on the resolved venue's theme, seamlessly adapting the signature dark glassmorphic layout.

### Baseline Gridpass Design Tokens
Our styling, implemented in `globals.css`, establishes a premium, high-contrast dark environment:
*   **Theme Background**: Carbon Black Slate (`#060608`)
*   **Text Foreground**: Soft White-Grey (`#f4f4f7`)
*   **Base Utilities**:
    *   `.glass-card`: Glassmorphism containing `backdrop-filter: blur(16px)`, `background: rgba(10, 10, 14, 0.65)`, and a translucent border `1px solid rgba(255, 255, 255, 0.08)`.
    *   `.glass-input`: Low-opacity inputs transitioning to high-contrast borders on focus.
    *   `.btn-glow`: Animated horizontal reflection shine mapping partner HSL gradients.

### Co-Branding HSL Variable Schema

```css
/* Dynamic CSS Variable Overrides (Injected by React State) */
:root {
  /* Default Gridpass Brand Theme */
  --partner-primary-hsl: 217 91% 60%;         /* Primary Brand Color HSL */
  --partner-primary: hsl(var(--partner-primary-hsl));
  
  --partner-accent-hsl: 160 84% 45%;          /* Accent Color HSL */
  --partner-accent: hsl(var(--partner-accent-hsl));
  
  --partner-glow-hsl: 217 91% 40%;            /* Radial Mesh Background Glow HSL */
  --partner-glow-opacity: 0.15;               /* Glow Intensity */
  
  --text-highlight: var(--partner-primary);
  --btn-touch-target-height: 54px;            /* Glove-Friendly Interactive Height */
  --btn-secondary-height: 48px;
}
```

### CSS Overlay Definitions (`src/app/globals.css` Extensions)

```css
/* Dynamically Blended Ambient Background */
.partner-mesh-glow {
  position: absolute;
  top: -15%;
  left: 50%;
  transform: translateX(-50%);
  width: 100vw;
  height: 550px;
  background: 
    radial-gradient(circle at 30% 20%, hsl(var(--partner-primary-hsl) / var(--partner-glow-opacity)) 0%, transparent 55%),
    radial-gradient(circle at 70% 60%, hsl(var(--partner-glow-hsl) / 0.1) 0%, transparent 60%);
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

/* High-Contrast Interactive Touch Targets */
.btn-partner-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--btn-touch-target-height);
  background-color: var(--partner-primary);
  color: #ffffff;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 8px;
  box-shadow: 0 4px 14px 0 hsl(var(--partner-primary-hsl) / 0.3);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid hsl(var(--partner-primary-hsl) / 0.5);
  cursor: pointer;
}

.btn-partner-primary:hover {
  filter: brightness(1.15);
  box-shadow: 0 6px 20px 0 hsl(var(--partner-primary-hsl) / 0.45);
  transform: translateY(-1px);
}

.btn-partner-primary:active {
  transform: translateY(1px);
  filter: brightness(0.95);
}

/* Glove-Friendly Interactive Secondary Cards */
.border-partner-accent {
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease-in-out;
}

.border-partner-accent:hover {
  border-color: var(--partner-accent);
  box-shadow: inset 0 0 12px hsl(var(--partner-accent-hsl) / 0.08);
}

.text-partner-accent {
  color: var(--partner-accent);
}

/* Dynamic Status Clearing Frames */
.status-clear-glow {
  animation: pulse-emerald 2s infinite ease-in-out;
}

@keyframes pulse-emerald {
  0%, 100% {
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.2), inset 0 0 15px rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
  }
  50% {
    box-shadow: 0 0 25px rgba(16, 185, 129, 0.4), inset 0 0 25px rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.6);
  }
}
```

### Example Dynamic JSON Partner Payload
When a partner's QR tag resolves, the frontend binds this dynamic B2B theme block:

```json
{
  "partner_id": "sonoma-raceway",
  "name": "Sonoma Raceway",
  "logo_url": "https://assets.gridpass.app/logos/sonoma_raceway.png",
  "theme": {
    "primary_hsl": "358 79% 50%",
    "accent_hsl": "210 100% 12%",
    "glow_hsl": "358 79% 35%",
    "glow_opacity": 0.22
  },
  "config": {
    "waiver_id": "sonoma-general-2026",
    "require_tech": true,
    "paddock_routing_lane": 2
  }
}
```

### Solar Light Mode CSS Overrides & Progressive Enhancement Fallbacks

To ensure 100% legibility under direct 10,000+ nits solar glare and prevent sensor-shading single-point-of-failure (SPOF) lockouts, we implement the following CSS overrides and JavaScript progressive enhancements:

#### 1. Solar Light Mode Absolute CSS Overrides

When the `solar-light-mode` class is active on the `body`, all dynamic brand HSL color variables are completely overridden with absolute pure black (`#000000`) and pure white (`#ffffff`). This forces a binary, ultra-high contrast UI regardless of any custom B2B HSL variables defined by the venue.

```css
/* Solar Light Mode Style Overrides */
body.solar-light-mode {
  --partner-primary: #000000 !important;
  --partner-primary-hsl: 0 0% 0% !important;
  --partner-accent: #000000 !important;
  --partner-accent-hsl: 0 0% 0% !important;
  --partner-glow-hsl: 0 0% 0% !important;
  --partner-glow-opacity: 0 !important;
  
  background-color: #ffffff !important;
  background-image: none !important;
  color: #000000 !important;
}

body.solar-light-mode .glass-card,
body.solar-light-mode .glass-input {
  background: #ffffff !important;
  backdrop-filter: none !important;
  border: 2px solid #000000 !important;
  color: #000000 !important;
  box-shadow: none !important;
}

body.solar-light-mode .btn-partner-primary {
  background-color: #000000 !important;
  color: #ffffff !important;
  border: 2px solid #000000 !important;
  box-shadow: none !important;
}

body.solar-light-mode .btn-partner-primary:hover,
body.solar-light-mode .btn-partner-primary:active {
  background-color: #333333 !important;
  transform: none !important;
}

body.solar-light-mode text, 
body.solar-light-mode span, 
body.solar-light-mode h1, 
body.solar-light-mode h2, 
body.solar-light-mode h3, 
body.solar-light-mode p,
body.solar-light-mode div {
  color: #000000 !important;
}

/* Explicit CSS overrides for SVG graphics and B2B logos to prevent clashing on white backgrounds */
body.solar-light-mode svg:not(.barcode-image),
body.solar-light-mode svg *:not(.barcode-image-dot):not(path):not(circle):not(rect):not(line),
body.solar-light-mode .brand-logo:not(.logo-raster),
body.solar-light-mode .partner-graphic,
body.solar-light-mode .logo-fill,
body.solar-light-mode .logo-stroke {
  stroke: #000000 !important;
  fill: #000000 !important;
}

/* Explicit custom overrides for brand layouts and SVG element strokes/fills to guarantee high contrast */
body.solar-light-mode svg.brand-graphic-svg path,
body.solar-light-mode svg.logo-layout-svg path,
body.solar-light-mode svg:not(.barcode-image) [fill^="#fff" i],
body.solar-light-mode svg:not(.barcode-image) [fill^="white" i],
body.solar-light-mode svg:not(.barcode-image) [stroke^="#fff" i],
body.solar-light-mode svg:not(.barcode-image) [stroke^="white" i] {
  fill: #000000 !important;
  stroke: #000000 !important;
}

/* Exclude QR barcode container, barcode images, and signature drawing canvas from global CSS brightness/inversion filters */
body.solar-light-mode *:not(.barcode-container):not(.barcode-image):not(#signature-canvas):not(.canvas-stroke) {
  filter: none; /* Do not apply global brightness or inversion filters to active scanning blocks */
}

body.solar-light-mode .barcode-container,
body.solar-light-mode .barcode-image,
body.solar-light-mode #signature-canvas {
  background-color: #ffffff !important;
  filter: none !important;
  opacity: 1.0 !important;
  border: 2px solid #000000 !important;
}

/* Co-branded B2B assets upload standards */
/* MANDATORY INLINING: To prevent sandboxed <img> SVGs from escaping document-level CSS styling (which results in white SVGs becoming invisible on pure white direct solar glare screens), all B2B partner logos and SVGs must be explicitly inlined directly in the HTML DOM (e.g., as custom React inline SVG components) rather than loaded via standard <img> tags. This guarantees that document-level CSS rules can target and style their internal paths. */
body.solar-light-mode svg:not(.barcode-image) path {
  fill: #000000 !important;
  stroke: #000000 !important;
}

body.solar-light-mode .logo-raster {
  mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 100%);
  filter: grayscale(100%) contrast(1000%) invert(1) !important; /* Force raster PNGs to black */
}

/* Fallback for fixed white stroke/fill styling or raster logo image clashes */
body.solar-light-mode img.brand-logo-white-bordered,
body.solar-light-mode .logo-invert-target {
  filter: invert(1) brightness(0) contrast(200%) !important; /* Force B2B logos/graphics to black */
}

/* Force QR and barcodes to have absolute high-contrast white backing cards */
body.solar-light-mode .barcode-container {
  background-color: #ffffff !important;
  border: 2px solid #000000 !important;
  padding: 10px !important;
}

/* Preserve emerald green clearance cue for paddock marshals in Solar Light Mode */
body.solar-light-mode .status-clear-glow,
body.solar-light-mode .status-clear-card {
  border: 4px solid #10b981 !important;
  box-shadow: none !important;
  background-color: #ffffff !important;
}
```

#### 2. Ambient Light Sensor API Progressive Enhancement & Fallback

Since the Experimental Ambient Light Sensor API has 0% support on iOS Safari and is highly vulnerable to sensor-shade SPOF lockouts (where holding the phone shadows the sensor and keeps the dark theme active in high glare), we treat the API strictly as a **progressive enhancement** and prioritize a physical button toggle:

1.  **Primary Physical Toggle**: A prominent, glove-friendly toggle button is placed permanently in the header (`H=54px`, high-contrast borders).
2.  **State Persistence**: The manual toggle button acts as the single source of truth, persisting directly to `indexedDB` or `localStorage` to override any sensor readings.
3.  **Sensor API Implementation (Progressive Enhancement)**:
    ```javascript
    if ('AmbientLightSensor' in window) {
      try {
        const sensor = new AmbientLightSensor({ frequency: 0.5 });
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
        sensor.start();
      } catch (err) {
        console.warn("AmbientLightSensor failed to initialize, falling back to manual toggle:", err);
      }
    }
    ```
4.  **Anti-SPOF Guard**: Manual clicks on the header toggle permanently deactivate the sensor listener instance for that session, preventing shadow shade spikes from overriding the user's manual choice.

#### 3. Flash of Dark Theme (FODT) Head Script Mitigation

To prevent a sensor-shading single-point-of-failure or visual jarring from a sudden theme flash (where the premium dark glassmorphic theme renders briefly before the script switches to Solar Light Mode in 10,000+ nits glare), a synchronous blocking script is embedded directly within the document `<head>` tag. This script parses raw `localStorage` or local persistent override states and immediately applies the `.solar-light-mode` class directly to the document root element *prior* to any CSS parsing, asset downloads, or React UI hydration.

```html
<!-- High-Priority Inline Blocking Script in <head> to prevent FODT -->
<script>
  (function() {
    try {
      const themeOverride = localStorage.getItem('manual-theme-override');
      if (themeOverride === 'solar-light-mode') {
        document.documentElement.classList.add('solar-light-mode');
        // Ensure immediate application to body class if already parsed, or schedule on DOMContentLoaded
        document.addEventListener('DOMContentLoaded', function() {
          document.body.classList.add('solar-light-mode');
        });
      }
    } catch (e) {
      console.warn("FODT theme mitigation script error:", e);
    }
  })();
</script>
```

---

## 4. Mobile-First ASCII-Art Layout Mockups

The following mobile-first layout mockups are designed strictly within **375px–412px viewport boundaries** (iPhone SE to modern Android widths), ensuring single-column stacks with high-density spacing to eliminate horizontal scrolling. All touch interactive targets scale between **48px and 54px** for glove-wearing and outdoor visibility.

### Scenario A: Tracks & Racing Circuits (Towing & Paddock Gate Check-In)
*   **Primary Accent**: Racing Red (`#e21a22` / `HSL 358 79% 50%`)
*   **Key Focus**: 10-foot marshal visual clearance indicator, digital tech approvals, high-contrast gate barcode scanning.

```
+───────────────────────────────────────────────────+ 375px Viewport Width
| [GP] GRIDPASS FAST-PASS          [SONOMA LOGO]    | <- Header (H=48px, px-4)
+───────────────────────────────────────────────────+
|                                                   |
|  +─────────────────────────────────────────────+  |
|  |  GATE SCAN PASS (ABOVE THE FOLD)            |  |
|  |  ================                           |  |
|  |  ||||| | ||||| || |||||| | ||| | ||| ||||   |  | <- High-contrast barcode
|  |  GP-SONOMA-4091-AF8                         |  | <- text-mono text-xs
|  +─────────────────────────────────────────────+  |
|  [20px Margin]                                    |
|  +─────────────────────────────────────────────+  |
|  | ☀️ MAX BRIGHTNESS FOR GATE SCANNING          |  | <- High-visibility Brightness Prompt
|  | Please turn screen brightness to 100% and    |  |
|  | angle display towards marshal scanner.       |  |
|  +─────────────────────────────────────────────+  |
|  [20px Margin]                                    |
|  +─────────────────────────────────────────────+  |
|  | [V] WAIVER SIGNED & REGISTERED              |  | <- .glass-card, pulse-emerald
|  |  Check-In Status: APPROVED                  |  | <- text-emerald-400 font-bold
|  |  Time: 2026-05-22 10:37 UTC                 |  | <- text-[10px] text-slate-500
|  +─────────────────────────────────────────────+  |
|  [20px Margin]                                    |
|  WELCOME TO SONOMA RACEWAY!                       | <- text-2xl font-black
|  HPDE Track Entry Portal                          | <- text-xs text-slate-400
|                                                   |
|  +─────────────────────────────────────────────+  |
|  | RIG SPECIFICATIONS                          |  | <- text-[10px] text-slate-400
|  |  Driver: John Doe                           |  | <- Decoded metadata visible to marshal
|  |  Tow:   Ford F-250 Super Duty (White)       |  | <- text-xs text-slate-200
|  |  Cargo: 2021 Porsche 911 GT3 (Red)          |  |
|  |  Plate: ABC-1234 (Tow) / PRSH-911 (Cargo)   |  |
|  |  Group: Intermediate (Run Group B)          |  |
|  |  Tech:  [APPROVED] self-tech certified      |  | <- text-emerald-400
|  +─────────────────────────────────────────────+  |
|  [20px Margin]                                    |
|  +─────────────────────────────────────────────+  |
|  |             [ Add to Apple Wallet ]         |  | <- Native Apple Wallet (H=54px)
|  +─────────────────────────────────────────────+  |
|  [20px Margin]                                    |
|  +─────────────────────────────────────────────+  |
|  |             [ Add to Google Wallet ]        |  | <- Native Google Wallet (H=54px)
|  +─────────────────────────────────────────────+  |
|  [20px Margin]                                    |
|  +─────────────────────────────────────────────+  |
|  |      SUBMIT NEW VEHICLE TECH SHEET          |  | <- Secondary Button (H=54px)
|  +─────────────────────────────────────────────+  |
|                                                   |
|  Gridpass Network v4 (Paddock Gate Ingress)        | <- Footer (9px text-slate-600)
+───────────────────────────────────────────────────+
```

*   **Layout Specifications**:
    *   *External Container*: `flex flex-col space-y-5 px-4 py-3 bg-[#060608] min-h-screen text-[#f4f4f7]`
    *   *Waiver Card*: `.glass-card .status-clear-glow border border-emerald-500/30 p-3 flex flex-col`
    *   *Interactive CTAs*: Custom Red button mapping `bg-[#e21a22]` and native OS wallet SVGs scaled to a minimum of `54px` height and separated by at least `20px` margins to prevent glove-induced adjacent mis-taps.

---

### Scenario B: Offroad & Adventure Parks (Glared Trails & OHV Permit Registry)
*   **Primary Accent**: Trail Orange (`#d97706` / `HSL 35 84% 45%`)
*   **Key Focus**: Weather warnings, day-pass validity countdown timer, multi-passenger registrations, offline maps.

```
+───────────────────────────────────────────────────+ 375px Viewport Width
| [GP] GRIDPASS OFFROAD            [RAUSCH CREEK]   | <- Header (H=48px, px-4)
+───────────────────────────────────────────────────+
|                                                   |
|  RAUSCH CREEK OFFROAD PARK                        | <- text-2xl font-black
|  OHV Entry Terminal                               | <- text-xs text-slate-400
|                                                   |
|  +─────────────────────────────────────────────+  |
|  | ☀️ MAX BRIGHTNESS FOR GATE SCANNING          |  | <- High-visibility Brightness Prompt
|  | Please turn screen brightness to 100% and    |  |
|  | angle display towards marshal scanner.       |  |
|  +─────────────────────────────────────────────+  |
|  [20px Spacing]                                   |
|  + ! SAFETY FLAG REQUIRED ON ALL VEHICLES ! ────+  | <- Warning Card (.glass-card)
|  |  All OHVs must fly a 10ft orange safety whip.  | <- text-yellow-500 text-xs
|  |  Please verify before entering trail paths.    |
|  +─────────────────────────────────────────────+  |
|  [20px Spacing]                                   |
|  +─────────────────────────────────────────────+  |
|  | ACTIVE TRAIL PERMIT                         |  | <- .glass-card, border-orange-500/20
|  |  Pass Status: ACTIVE DAY PASS               |  | <- text-orange-400 font-bold
|  |  Expires:     Today at 6:00 PM (EDT)        |  |
|  |  Time Left:   7 Hrs, 22 Mins                |  | <- font-black text-slate-200
|  +─────────────────────────────────────────────+  |
|  [20px Spacing]                                   |
|  +─────────────────────────────────────────────+  |
|  | PERMIT & PASSENGERS                         |  | <- text-[10px] text-slate-400
|  |  Driver:  John Doe                          |  |
|  |  OHV:     2023 Polaris RZR XP 1000          |  |
|  |  Permit:  PA-OHV-9821-XP                    |  |
|  |  Riders:  2 Active (Waivers Verified)       |  |
|  +─────────────────────────────────────────────+  |
|  [20px Spacing]                                   |
|  +─────────────────────────────────────────────+  |
|  | SHOW RANGER DAY PASS (BARCODE)              |  | <- Primary Orange Button (H=54px)
|  +─────────────────────────────────────────────+  |
|  [20px Spacing]                                   |
|  +─────────────────────────────────────────────+  |
|  | DOWNLOAD OFFLINE TRAIL MAP (PDF)            |  | <- Secondary Card Button (H=48px)
|  +─────────────────────────────────────────────+  |
|  [20px Spacing]                                   |
|  Gridpass Network v4 (Offroad Telemetry Registry)  | <- Footer (9px text-slate-600)
+───────────────────────────────────────────────────+
```

*   **Layout Specifications**:
    *   *Warning Banner*: `.glass-card border border-yellow-600/30 bg-yellow-950/20 p-3`
    *   *Ranger Day Pass Button*: `btn-partner-primary` styled with Trail Orange (`bg-[#d97706]`), optimized for instant activation under high outdoor sun glare.
    *   *Offline Map Button*: `.border-partner-accent backdrop-filter blur-md py-3 text-center rounded-lg text-xs` to allow rapid manual caching of track PDF files.

---

### Scenario C: Enthusiast Car Clubs & Chapters (Showcase Display & Engagement)
*   **Primary Accent**: Sleek Neon Cyan (`#06b6d4` / `HSL 190 90% 43%`)
*   **Key Focus**: Prestige branding, verified vehicle specs, modifications log, live crowd-sourced leaderboard peer-voting.

```
+───────────────────────────────────────────────────+ 375px Viewport Width
| [GP] GRIDPASS CHAPTERS           [ELITE CLUB]     | <- Header (H=48px, px-4)
+───────────────────────────────────────────────────+
|                                                   |
|  ELITE CARS & COFFEE                              | <- text-2xl font-black
|  Paddock Display Garage                           | <- text-xs text-slate-400
|                                                   |
|  +─────────────────────────────────────────────+  |
|  | REGISTERED EXHIBITOR                        |  | <- .glass-card
|  |  Space: #142 (Main Boulevard)               |  | <- text-cyan-400 font-bold
|  +─────────────────────────────────────────────+  |
|                                                   |
|  +─────────────────────────────────────────────+  |
|  | VEHICLE GARAGE PROFILE                      |  | <- text-[10px] text-slate-400
|  |  Car:  2018 BMW M3 Competition (F80)        |  | <- text-xs text-slate-200
|  |  Power:510 WHP (Dyno Verified)              |  |
|  |  Mods: Akrapovic Exhaust, KW V3 Susp, CSF   |  |
|  |  Link: gridpass.app/v/bmw-m3-comp           |  | <- text-cyan-400 text-[10px]
|  +─────────────────────────────────────────────+  |
|                                                   |
|  +─────────────────────────────────────────────+  |
|  | VIBE CHECK LEADERBOARD                      |  | <- Live Paddock Voting List
|  |  1. 1993 Mazda RX-7 FD (142 Votes)          |  |
|  |  2. 2018 BMW M3 Competition (98 Votes)      |  | <- Active Highlight Card
|  |  3. 2021 Porsche Cayman GT4 (81 Votes)      |  |
|  +─────────────────────────────────────────────+  |
|                                                   |
|  +─────────────────────────────────────────────+  |
|  | VOTE FOR THIS DISPLAY CAR                   |  | <- Primary Cyan Button (H=54px)
|  +─────────────────────────────────────────────+  |
|                                                   |
|  +─────────────────────────────────────────────+  |
|  | JOIN PRIVATE CLUB FORUM                     |  | <- Secondary Button (H=48px)
|  +─────────────────────────────────────────────+  |
|                                                   |
|  Gridpass Network v4 (Enthusiast Registry)        | <- Footer (9px text-slate-600)
+───────────────────────────────────────────────────+
```

*   **Layout Specifications**:
    *   *Leaderboard Component*: Vertical stack with dynamic list items. The actively scanned car receives a neon-cyan halo border (`border-cyan-500/40`) to highlight its rank.
    *   *Vote Button*: Height scaled to `54px` using HSL Cyan (`bg-[#06b6d4]`) with a pulsing hover effect.

---

### Gate Operator Authentication & Verification UI Mockups

To support various venue-level security requirements, the gate operator scanner UI can operate in two distinct modes.

#### Mode 1: Secure "Gate Operator" PIN Overlay
*For high-security operations (e.g. NASCAR pits or closed track days).*

```
+───────────────────────────────────────────────────+ 375px Viewport Width
| [GP] OPERATOR PANEL               [NASCAR VENUE]  | <- Header (H=48px, px-4)
+───────────────────────────────────────────────────+
|                                                   |
|  +── [!] SECURE OPERATOR AUTHENTICATION ────────+  | <- Security Lock Card
|  |                                                 |  |
|  |  Enter 4-Digit Gate Operator PIN:               |  |
|  |                                                 |  |
|  |         [ * ]   [ * ]   [ * ]   [ * ]           |  | <- PIN Input Dots
|  |                                                 |  |
|  |     +─────+   +─────+   +─────+                 |  |
|  |     |  1  |   |  2  |   |  3  |                 |  | <- Virtual Keypad
|  |     +─────+   +─────+   +─────+                 |  |
|  |     |  4  |   |  5  |   |  6  |                 |  |
|  |     +─────+   +─────+   +─────+                 |  |
|  |     |  7  |   |  8  |   |  9  |                 |  |
|  |     +─────+   +─────+   +─────+                 |  |
|  |               |  0  |                           |  |
|  |               +─────+                           |  |
|  |                                                 |  |
|  |   [ CANCEL ]             [ SUBMIT PIN ]         |  | <- Operator actions (H=48px)
|  +─────────────────────────────────────────────────+  |
|                                                   |
+───────────────────────────────────────────────────+
```

#### Mode 2: Low-Friction Public Confirmation View
*For low-security environments (e.g., offroad parks or casual club meets). If a visitor lacks a waiver or registration, a warning routing card is immediately displayed.*

```
+───────────────────────────────────────────────────+ 375px Viewport Width
| [GP] GATE CONFIRMATION            [TRAIL PARK]    | <- Header (H=48px, px-4)
+───────────────────────────────────────────────────+
|                                                   |
|  VEHICLE CHECK-IN CONFIRMATION                    |
|  OHV Public Display                               |
|                                                   |
|  +── [✔] WELCOME DRIVER! ─────────────────────────+  | <- Status Card (Green Glow)
|  |  Driver Name: John Doe                          |  |
|  |  Vehicle:     2023 Jeep Wrangler Rubicon        |  |
|  |  Plate:       JEP-OHV-9                         |  |
|  |  Waiver:      [ SIGNED & VERIFIED ]             |  | <- text-emerald-400
|  |  Registration:[ PAID & CLEAR ]                  |  | <- text-emerald-400
|  +─────────────────────────────────────────────────+  |
|                                                   |
|  +── [❌] WARNING: VISITOR NOT COMPLIANT ────────+  | <- Warning Card (Red Border)
|  |  Passenger:   Jane Doe                          |  |
|  |  Status:      MISSING LIABILITY WAIVER          |  |
|  |                                                 |  |
|  |  [!] VEHICLE HELD - TAP BELOW TO SIGN NOW       |  |
|  +─────────────────────────────────────────────────+  |
|                                                   |
|  +─────────────────────────────────────────────+  |
|  |      ROUTE TO DIGITAL WAIVER STATION        |  | <- High-contrast Red CTA (H=54px)
|  +─────────────────────────────────────────────+  |
|                                                   |
+───────────────────────────────────────────────────+
```

---

## 5. Database Schemas & API Resolvers

### Firestore Database Schemas (TypeScript Interfaces)

#### 1. `tags` (The Unified Central Registry)
*Binds physical QR code IDs to dynamic destinations.*
```typescript
import { Timestamp, GeoPoint } from 'firebase/firestore';

export interface TagRegistryDocument {
  id: string;                         
  type: 'vehicle' | 'user' | 'venue_gate' | 'event' | 'unclaimed';
  target_id: string | null;           
  owner_id: string | null;            
  created_at: Timestamp;
  updated_at: Timestamp;
  status: 'active' | 'unclaimed' | 'suspended'; 
}
```

#### 2. `venues` / `businesses` (The B2B Hosting Locations)
*Stores venue configurations, locations, and styling parameters for dynamic UI co-branding injection.*
```typescript
export interface VenueDocument {
  id: string;                         // Unique venue ID (e.g. "sonoma-raceway")
  tag_id: string;                     // Core physical ingress tag ID matching `tags` collection
  name: string;                       // e.g. "Sonoma Raceway"
  type: 'venue_gate';                 // Aligned type enum
  logo_url: string;
  brand_colors: {
    primary_hsl: string;              // HSL formatting (e.g., "358 79% 50%")
    accent_hsl: string;
    glow_hsl: string;
    glow_opacity: number;
  };
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    geo: GeoPoint;                      // Native Firestore GeoPoint for radial and proximity querying
  };
  owner_id: string;                   // Link to owner's B2B user ID
  status: 'active' | 'unclaimed' | 'suspended'; // Aligned status enum
}
```

#### 3. `events` (Local Event Calendars & Run Groups)
*Holds schedules, dates, and run group mappings.*
```typescript
export interface EventDocument {
  id: string;                         // e.g. "sonoma-hpde-may2026"
  venue_id: string;                   // Foreign key mapping to `venues`
  name: string;                       // e.g. "Sonoma HPDE Track Day"
  type: 'event';                      // Aligned type enum
  date: Timestamp;                    // Firestore Timestamp for range query flexibility
  start_time: Timestamp;              // Firestore Timestamp for timezone resilience
  end_time: Timestamp;                // Firestore Timestamp for timezone resilience
  status: 'active' | 'unclaimed' | 'suspended'; // Aligned status enum
  waiver_template_id: string;         // Foreign key mapping to `waiver_templates`
  schedule: Array<{
    time: string;                     // e.g. "07:15 - 08:00"
    title: string;                    // e.g. "Mandatory Drivers Meeting"
    description: string;
    group: string;                    // e.g. "All", "Novice", "Advanced"
  }>;
}
```

#### 4. `registrations` (Dynamic Gate Clearance State Matrix)
*The intersection table representing the live active status of a driver and rig at a specific gate check-in.*
```typescript
export interface RegistrationDocument {
  id: string;                         // Document ID
  event_id: string;                   // Foreign key mapping to `events`
  user_id: string;                    // Foreign key mapping to `users`
  vehicle_id: string | null;          // Foreign key mapping to `vehicles` (nullable to support spectator bypass check-ins)
  passenger_registration_ids: string[]; // Foreign keys mapping to secondary passenger/rider `registrations` to verify all riders with a single scan
  run_group: 'novice' | 'intermediate' | 'advanced' | 'instructor' | 'spectator';
  payment_status: 'paid' | 'pending' | 'exempt';
  waiver_signed: boolean;
  waiver_signature_id: string | null; // Foreign key mapping to `waiver_signatures`
  external_waiver_token?: string | null; // External third-party waiver token (e.g. SmartWaiver)
  external_waiver_status?: string | null; // External third-party waiver status
  tech_inspected: boolean;
  tech_inspector: string | null;
  check_in_status: 'pre_registered' | 'checked_in' | 'no_show';
  checked_in_at: Timestamp | null;
  wallet_pass_status: 'not_generated' | 'added' | 'removed';
  cryptographic_signature: string;    // Asymmetric Ed25519 signature generated by server's private key containing driver metadata (event ID, vehicle ID, waiver status, etc.) for offline verification
  tow_vehicle_type: 'pickup' | 'suv' | 'commercial' | 'none'; // Declared tow vehicle type to prevent data loss
  trailer_type: 'none' | 'flatbed' | 'enclosed';              // Declared trailer configuration
  tow_vehicle_plate: string | null;                           // Declared tow vehicle plate scanned or captured via OCR
  trailer_plate: string | null;                               // Declared trailer plate scanned or captured via OCR
  status: 'active' | 'unclaimed' | 'suspended'; // Aligned status enum
  type: 'registration';               // Aligned type enum mapping
  is_unverified_bypass: boolean; // Flag identifying unverified guest spectator bypass sessions
  driver_legal_name: string;          // Legal name (max 24 characters) for offline ID verification
  passenger_names: string[];          // Legal names of verified checked-in passengers
}
```

#### 5. `waiver_signatures` (Liability Compliance Hashes)
*Captures cryptographic signatures, biometric selfie verification, and digital sign-off metadata.*
```typescript
export interface WaiverSignatureDocument {
  id: string;
  waiver_id: string;                  // Link to waiver content document
  user_id: string;                    // Foreign key mapping to `users`
  event_id: string;                   // Foreign key mapping to `events`
  signed_name: string;                // Must match driver's legal profile name
  signed_at: Timestamp;
  selfie_verification_url: string;    // Verification photo captured during onboarding
  signature_ip: string;
  signature_hash: string;             // SHA-256 (user_id + event_id + signed_at + salt)
  signature_strokes: string;          // Serialized SVG path or stroke coordinate array representing drawn signature for ESIGN compliance
  signature_image_url: string | null; // Cloud Storage link to the signed image file (PNG/SVG) to guarantee legal defensibility
  status: 'verified' | 'pending_audit' | 'rejected';
}
```

#### 6. `users` (User Profiles & Club Membership)
*Stores comprehensive member details, contact info, registered vehicles, and subscription statuses.*
```typescript
export interface UserDocument {
  id: string;                         // Unique user ID (Auth UID)
  first_name: string;
  last_name: string;
  email: string;                      // Must be verified
  phone: string;                      // SMS OTP target
  membership_tier: 'free' | 'silver' | 'gold' | 'admin';
  registered_vehicle_ids: string[];   // Array of foreign keys mapping to `vehicles`
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

#### 7. `vehicles` (Enthusiast Garage Assets)
*Captures detailed vehicle specs, dyno verification, and privacy visibility settings.*
```typescript
export interface VehicleDocument {
  id: string;                         // Unique vehicle ID
  owner_id: string;                   // Foreign key mapping to `users`
  year: number;
  make: string;
  model: string;
  trim: string | null;
  category: 'car' | 'truck' | 'suv' | 'motorcycle' | 'utv' | 'other';
  license_plate: string | null;
  vin: string | null;
  vin_verified: boolean;
  specifications: {
    engine: string | null;
    power_hp: number | null;          // Power output
    transmission: string | null;
    weight_lbs: number | null;
  };
  dyno_sheet_url: string | null;      // Verifiable proof of power
  is_public: boolean;                 // Windshield Privacy Filter toggle (if false, anonymous in rosters)
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

#### 8. `waiver_templates` (Legal Waiver Templates)
*Defines legal boilerplate and versions for active circuit waivers.*
```typescript
export interface WaiverTemplateDocument {
  id: string;                         // e.g. "sonoma-general-2026"
  version: string;                    // e.g. "2026.1"
  title: string;                      // e.g. "Sonoma Raceway General Liability Waiver"
  legal_text: string;                 // Full legal body text compliant with state motorsport laws
  active_event_ids: string[];         // Foreign keys mapping to active `events` utilizing this template
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### Server-Side Route Resolver: `/api/resolve-tag`
When a QR code is scanned, the page fetches config data from the backend resolver.

#### HTTP Query Contract
*   **Request URL**: `GET /api/resolve-tag?id=GP-4091-AF8&lat=38.1611&lng=-122.4546`
*   **Parameters**:
    *   `id` (string, required): Scanned QR ID.
    *   `lat`, `lng` (number, optional): Geolocation coordinates to verify radius checks.

#### Casing Mapping & Standardization (Data Validation Safety)
The backend resolver acts as a bridge between the `snake_case` fields used in the Firestore database (which are optimized for database querying and indexing) and the `camelCase` fields required by the `/api/resolve-tag` JSON schema. This ensures payload validation compatibility and prevents validation crashes. The API schema strictly standardizes and parses these fields on delivery.

Standard naming mappings from the Firestore `registrations` schema to the `/api/resolve-tag` JSON API properties:
*   `is_unverified_bypass` ➔ `isUnverifiedBypass` (boolean): Flag identifying unverified guest spectator bypass sessions.
*   `tow_vehicle_type` ➔ `towVehicleType` (string): Declared type of the primary tow vehicle (e.g., 'pickup', 'suv', 'commercial', 'none').
*   `tow_vehicle_plate` ➔ `towVehiclePlate` (string or null): Scanned or manually entered license plate of the tow vehicle.
*   `trailer_type` ➔ `trailerType` (string): Declared trailer configuration (e.g., 'none', 'flatbed', 'enclosed').
*   `trailer_plate` ➔ `trailerPlate` (string or null): Scanned or manually entered license plate of the trailer.

These towing-audit fields (`towVehicleType` string, `towVehiclePlate` string/null, and `trailerType` string) are explicitly declared under the `/api/resolve-tag` JSON schema's `registrationContext.properties` and are fully validated by the server and client interfaces, allowing gate marshals to perform visual rig-matching check-ins.

#### Unified JSON Schema (`api/resolve-tag` payload)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ResolveTagPayload",
  "type": "object",
  "properties": {
    "tagId": { "type": "string" },
    "tagType": { "type": "string", "enum": ["vehicle", "user", "venue_gate", "event", "unclaimed"] },
    "status": { "type": "string", "enum": ["active", "unclaimed", "suspended"] },
    "venueContext": {
      "type": "object",
      "properties": {
        "venueId": { "type": "string" },
        "name": { "type": "string" },
        "logoUrl": { "type": "string" },
        "primaryColor": { "type": "string" },
        "accentColor": { "type": "string" }
      },
      "required": ["venueId", "name", "logoUrl"]
    },
    "eventContext": {
      "type": "object",
      "properties": {
        "eventId": { "type": "string" },
        "name": { "type": "string" },
        "date": { "type": "string", "format": "date" },
        "schedule": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "time": { "type": "string" },
              "title": { "type": "string" },
              "group": { "type": "string" }
            },
            "required": ["time", "title"]
          }
        }
      },
      "required": ["eventId", "name", "date"]
    },
    "vehicleContext": {
      "type": "object",
      "properties": {
        "vehicleId": { "type": ["string", "null"] },
        "year": { "type": "integer" },
        "make": { "type": "string" },
        "model": { "type": "string" },
        "ownerName": { "type": "string" },
        "vinVerified": { "type": "boolean" },
        "category": { "type": "string", "enum": ["car", "truck", "suv", "motorcycle", "utv", "other"] }
      },
      "required": ["vehicleId", "year", "make", "model", "ownerName"]
    },
    "registrationContext": {
      "type": "object",
      "properties": {
        "isRegistered": { "type": "boolean" },
        "runGroup": { "type": "string" },
        "waiverStatus": { "type": "string", "enum": ["SIGNED", "MISSING", "PENDING_VERIFICATION"] },
        "techStatus": { "type": "string", "enum": ["PASSED", "PENDING", "FAILED"] },
        "checkInStatus": { "type": "string", "enum": ["pre_registered", "checked_in", "no_show"] },
        "towVehicleType": { "type": "string", "description": "Type of the tow vehicle (mapped from Firestore tow_vehicle_type)" },
        "towVehiclePlate": { "type": ["string", "null"], "description": "License plate of the tow vehicle (mapped from Firestore tow_vehicle_plate)" },
        "trailerType": { "type": "string", "description": "Type of the trailer (mapped from Firestore trailer_type)" },
        "trailerPlate": { "type": ["string", "null"], "description": "License plate of the trailer (mapped from Firestore trailer_plate)" },
        "isUnverifiedBypass": { "type": "boolean", "description": "Flag identifying unverified guest spectator bypass sessions (mapped from Firestore is_unverified_bypass)" },
        "driverLegalName": { "type": "string", "description": "Legal name for offline verification" },
        "passengerNames": { "type": "array", "items": { "type": "string" }, "description": "Legal names of passengers" },
        "externalWaiverToken": { "type": ["string", "null"], "description": "External third-party waiver token" }
      },
      "required": ["isRegistered", "waiverStatus", "checkInStatus", "isUnverifiedBypass", "driverLegalName", "passengerNames"]
    }
  },
  "required": ["tagId", "tagType", "status"]
}
```

---

## 6. Persuasive Conversion Mechanisms

To maximize B2C conversion rates in high-glare, fast-paced outdoor settings, we integrate four key behavioral and physical optimizations.

```
┌────────────────────────────────────────────────────────────────────────┐
│               HIGH-CONVERSION GATE INGRESS SYSTEM                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. SCAN AND BIND         2. DYNAMIC BRANDING      3. SOCIAL PAD-GARAGE │
│  Scan gate QR or tag      Blends Gridpass &       Spectators vote on   │
│  instant Wallet Pass      Sonoma logo; green      build specs; makes   │
│  geofenced to lockscreen  denotes approved.       check-in fun!        │
│    [█ QR] ──> [.pkpass]      [Sonoma | GP]           [VOTE ★ 911 GT3]  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. SMS OTP Quick Verification
*   **The Mobile Context Drop-off**: Standard registration forces users to input emails, create passwords, and exit their mobile browser to verify accounts. In a vehicle at the check-in queue, this leads to an 85% drop-off because smartphones frequently purge background browser tabs to save battery.
*   **The Optimization**: The Gridpass Ingress funnel uses a single-field SMS input. Entering a phone number validates the user via OTP within 15 seconds, keeping the browser viewport active. Account credentials can be safely configured later during paddock downtime.

### 2. Ambient Geofenced Lock-Screen Wallet Passes
*   **The Offline Challenge**: Racing tracks and offroad trailheads are frequently located in rural dead zones where cellular data drops.
*   **The Optimization**: The final boarding ticket generates an Apple/Google Wallet `.pkpass` bundle. 
    *   *Geofencing*: The pass includes a GPS bounding box centered on the track gates (e.g. Sears Point coordinates). When the vehicle rolls within a 500-meter radius, the pass wakes up the phone lock screen automatically. This is a soft geofence backed by hard marshal lane blocks. A soft geofence provides lock-screen notifications and pre-populates entry details, but the physical gate lane is hard-blocked by marshal lanes, where attendants visually inspect passes and scan barcodes.
    *   *Offline Scan*: The pass holds the server-signed asymmetric `cryptographic_signature` in a high-contrast 2D QR format, allowing gate attendants to verify the registration offline using pre-loaded public keys without requiring an active network connection or database lookup. Native Apple Wallet Pass `.pkpass` templates natively support lockscreen BLE/NFC triggers and display the offline-scannable 2D QR pass, allowing active BLE/NFC client connection requirements to be abandoned.

### 3. The Live "Virtual Paddock" Directory
*   **The Prestige Pull**: Automotive enthusiasts are highly motivated by community, pride in their vehicle builds, and networking.
*   **The Optimization**: Completing a gate check-in registers the user's vehicle in that day's live virtual paddock roster (e.g. `gridpass.app/events/sonoma-may2026`). Walking the paddock, other participants can scan physical windshield decals to view detailed dyno sheets, engine modifications, and telemetry histories. This creates a strong social incentive to claim and build out a robust digital garage.

### 4. Segment-Specific Value Propositions

#### Category A: Racing & HPDE Drivers
*   *The Pain*: Saturday morning registration lines that delay mandatory safety meetings.
*   *The Value Proposition*: 
    > *"Stop idling. Scan the Gate QR, sign your waiver in three taps, and get your digital Fast-Pass straight to your Apple Wallet. Clear the paddock gate in 3 seconds flat."*
*   *The Windshield Value Proposition*: 
    > *"Ditch the paper folder. Link this windshield tag to digitize your annual tech sheets and track maintenance logs, giving tech marshals instant access with a single scan."*

#### Category B: Trail Riders & OHV Parks
*   *The Pain*: Outdoor glare, mud, water, and zero cell service.
*   *The Value Proposition*: 
    > *"Towing multiple rigs? Bind your SUV, flatbed trailer, and UTVs to a single digital pass. Scan once at the gate to verify all passenger waivers instantly—even with absolute zero cell service."*
*   *The Trail Value Proposition*: 
    > *"Rangers can scan your weatherproof windshield decal on the deep trails to instantly pull up your active day pass, signed waivers, and emergency medical contacts."*

#### Category C: Chapter & Enthusiast Car Clubs
*   *The Pain*: Spreadsheet roster drift and volunteer administrator burnout.
*   *The Value Proposition*: 
    > *"Ditch the paper lists. Scan the guest banner QR to automatically verify your active club dues, sign waivers, and map your assigned paddock space."*
*   *The Social Value Proposition*: 
    > *"Throw away the card poster. Let spectators scan your windshield tag to view your high-res build history, dyno sheets, and vote for your car in the live meet leaderboard."*

### 5. Real-World Sunlight, Glove, and Privacy Optimizations

To handle the extreme environments of active paddocks and deep-trail gates, the Gridpass client architecture incorporates six physical-layer and privacy optimizations:

#### A. Solar Light Mode Toggle & Brand SVG Overrides
*   **The Environment**: Paddock gates experience direct, harsh sunlight yielding 10,000+ nits of ambient glare. Under these conditions, premium dark glassmorphic themes suffer mirror reflection, rendering capacitive mobile screens virtually unreadable. Furthermore, fixed white B2B partner logos and SVGs become completely invisible on white backgrounds.
*   **The Optimization**: The client integrates a high-contrast Solar Light Mode. The interface drops all gradients and transparent layers. It swaps to a high-contrast fallback stylesheet: pure white background (`#ffffff`), solid black text/icons (`#000000`), hard black borders (`2px solid #000000`), and pure black CTA buttons with white text.
*   **Exclusion of Scanning Elements**: All scanning QR barcode containers, barcode images, and signature drawing canvases are explicitly excluded from global CSS brightness/inversion filters using `:not()` selectors, ensuring they maintain raw white backgrounds with absolute black pixels for optical scanners.
*   **Inlined SVGs & Image Clashing Fix**: Mandate that all B2B partner logos and SVGs be explicitly inlined directly in the HTML DOM (e.g., as custom React inline SVG components) rather than loaded via `<img>` tags. This ensures that document-level CSS rules can successfully style their internal paths, preventing white SVG logos from clashing and disappearing on pure white backgrounds. For legacy raster PNG assets, co-branded partners must utilize transparent backgrounds alongside specific CSS contrast-preserving filters (`filter: grayscale(1) contrast(1000%) invert(1)`).
*   **Preserve Visual Color Cues**: To guarantee that paddock marshals can easily verify clearance from 10 feet away under direct sunlight, Solar Light Mode CSS overrides enforce a highly visible solid green border (`border: 4px solid #10b981 !important; box-shadow: none !important; background-color: #ffffff !important;`) on all active clearance cards rather than removing color cues entirely.

#### B. Zero-Touch Auto-Ingress & Device BLE/NFC Abandonment
*   **The Environment**: Drivers wearing fire-retardant racing gloves or mud-coated offroad gloves experience a complete loss of touch capability on capacitive smartphone displays, making manual screen navigation in gate queues impossible.
*   **The Optimization (Device BLE/NFC Abandonment & PWA Wi-Fi Sync)**: Because over 50-80% of active automotive enthusiasts run iOS devices where Safari blocks Web NFC completely and disables Web Bluetooth within PWAs and background Service Workers by default, the client application completely abandons background BLE/NFC active connection handshakes for client devices to prevent locks and delays. The application relies strictly on standard local WPA3-Personal Wi-Fi network endpoints (e.g., `http://192.168.1.1/api/sync-signature`) accessed via active foreground browser fetch loops while the user has the pass active. Additionally, the system leverages native Apple/Google Wallet Pass `.pkpass` bundles, which natively support OS lock-screen geofence and BLE/NFC triggers to automatically display the high-contrast offline-scannable 2D QR pass on the driver's phone. To address the fire glove touch bottleneck, high-visibility user-facing copy on the clearance screen prompts manual glove removal only during the mandatory physical signature canvas step.

#### C. Windshield Privacy Filter
*   **The Environment**: Open public paddock directories containing vehicle specifications, owner names, and precise event coordinates raise critical security and tracking concerns for owners of high-value motorsport assets.
*   **The Optimization**: Gridpass implements privacy-by-default paddock profile configurations in the `VehicleDocument` and `UserDocument` schemas. Windshield tags and public paddock directories are restricted. By default, paddock garage listings are anonymized, displaying only general vehicle specifications (e.g., Year/Make/Model/Power). The driver's legal name, precise GPS location, paddock coordinates, and contact details are fully encrypted and hidden behind attendee-verified credentials, requiring an active, marshal-verified event session to unlock.

#### D. Pre-Arrival Caching & Queue Mitigation
*   **The Environment**: Massive spectator/driver arrivals within a narrow 90-minute Saturday morning window create massive CPU bottlenecks on backend wallet signing APIs, leading to slow pass loading times, database lockouts, and long gate queues.
*   **The Optimization**: The server automatically pre-generates, cryptographically signs, and compiles all Apple/Google Wallet `.pkpass` bundles exactly 24 hours prior to the event start. These static binaries are cached globally on edge CDNs (e.g., Cloudflare Key-Value store). When a driver scans the QR banner at the gate or clicks the SMS confirmation link, the pass is served from the edge in under 100 milliseconds, entirely bypassing primary database queries and mitigating gate entry latency.

#### E. Spectator Bypass Guard & Active Vehicle Lane Lockout
*   **The Environment**: General spectators occasionally attempt to bypass gate entry points, vehicle technical inspections, or tow/rig verification by presenting spectator check-in credentials.
*   **The Optimization**: The `/api/resolve-tag` resolver and Firestore registration validation enforce strict user-type role checks. Spectator tags are dynamically tied to `user_type: 'spectator'` and cannot bypass the `RegistrationDocument` verification. The marshal's scanner strictly blocks spectator pass barcodes from vehicle lanes and paddock zones. If a spectator pass is scanned in a vehicle lane, the terminal triggers a persistent audio alarm, persistent haptic vibration, and a full screen block: **BLOCKED: SPECTATOR PASS IN VEHICLE LANE**. Furthermore, spectator passes completely omit vehicle and technical fields (such as `vehicleContext`, `towVehicleType`, `towVehiclePlate`, `trailerType`, and `trailerPlate`) in the `api/resolve-tag` response and `SignedSecurePass` payload. The vehicle technical/inspection status is managed solely through the driver's registration profile in Firestore and is not serialized into the compact binary pass payload (except where run groups implicitly segregate classes), ensuring visual or structural validation cannot be subverted.

#### F. Emergency Marshal Override & Service Worker Offline PWA Synchronization
*   **The Environment**: Dead-zone cellular areas delay SMS gateway OTP delivery, preventing users from receiving the 4-digit code and signing their waiver at the paddock gate. Concurrently, mobile OS local Wi-Fi captive portal hijackers launch a stripped-down Captive Network Assistant (CNA) browser viewport that lacks standard IndexedDB storage, isolates Service Worker caches from the primary browser, and triggers un-bypassable SSL warnings when custom CA certs are pinned (since browser engines handle TLS at the OS/engine level, violating the Service Worker sandbox).
*   **The Optimization (PWA Offline Canvas & CNA Bypass)**: Rather than hosting interactive signature canvases on unstable, isolated local CNA browser frames, the PWA client-side architecture pre-caches the full digital waiver form and local routes using a Service Worker on the driver's device during a 24-hour pre-arrival window. Since iOS Safari Private/Incognito modes restrict IndexedDB and local storage access, the web application actively detects Private Browsing mode and displays a high-visibility modal instructing the user to switch to standard browsing to complete the waiver.
*   **Captive Network Assistant (CNA) Bypass Warns**: The dynamic welcome screen features prominent warning micro-copy and a high-visibility badge instructing users to bypass the automatic CNA popup or manually open their native browser application (Safari or Chrome) to guarantee proper storage and session consistency.
*   **Public Wildcard DNS-to-IP Gateway Architecture**: To guarantee secure HTTPS verification without triggering scary "Connection is Not Private" browser SSL warning screens, all specifications regarding browser sandbox custom CA certificate pinning inside the Service Worker are removed. Instead, to completely eliminate the severe security risk of physical key theft, storing a publicly trusted wildcard SSL/TLS private key directly on physical paddock gate terminals or localized gate routers is strictly forbidden. Wildcard private keys must remain securely locked in cloud HSM/KMS environments. The local offline gateway architecture must utilize either: (1) localized, gateway-specific self-signed certificates with a simple manual trust prompt on the driver's native browser to establish secure HTTPS, or (2) secure, un-encrypted local HTTP routing restricted strictly inside password-protected, encrypted local WPA3-Personal Wi-Fi paddock networks.

### 6. Protobuf-Based Binary Metadata Compression (QR Version 11 Optimization)
*   **The Problem (Density Blowout)**: Embedding the complete Ed25519 signature (64 bytes) alongside a verbose JSON metadata block (270–313 bytes) results in a highly dense 377-byte text payload. This forces QR code generation into Version 17 or 18 (up to 7,921 modules), which cannot be reliably decoded under sunlight glare or low-quality mobile lenses, violating the <5-second entry SLA. Furthermore, embedding the signature directly inside the signed payload introduces a circular dependency during serialization.
*   **The Solution (Strict Cryptographic Envelope & Trial Verification DoS Fix)**: To resolve serialization order drift and guarantee seamless, deterministic multi-language offline signature verification, we implement a strict cryptographic envelope pattern `SignedSecurePass` that encapsulates the raw serialized metadata and the signature separately. The scanning terminal verifies the Ed25519 signature directly over the raw, immutable `serialized_metadata` bytes *before* attempting to parse them into `SecurePassMetadata`.
*   **Outer Key Fingerprint**: To prevent trial verification Denial of Service (DoS) attacks (where an attacker floods the gate with malformed QR codes to force scanning terminals into CPU-exhausting trial verification loops over all active public keys), an explicit `signing_key_id` is added to the **outer** `SignedSecurePass` envelope. The terminal uses this ID to instantly select the correct public key and validates the signature *before* parsing the untrusted payload, protecting the parser from binary exploits.
*   **Offline Passenger Waiver Verification (Collision-Resistant 64-Bit Binary Fix)**: The inner `SecurePassMetadata` protobuf message utilizes `repeated bytes passenger_waiver_hashes = 10;` storing exactly **8 bytes of raw binary** SHA256 waiver hashes for all passengers. Storing 8 bytes of raw binary (64 bits of entropy) instead of a 32-bit truncated hex string increases entropy from 32-bits to 64-bits. This raises the collision threshold from a weak $2^{16} = 65,536$ trials (vulnerable to smartphone brute-force spoofing) to over $2^{32} \approx 4.29$ billion trials, neutralizing the birthday paradox waiver evasion threat vector.
*   **Screenshot Evasion Guards**: The inner `SecurePassMetadata` protobuf message is enriched with the driver's legal name, tow vehicle plate, and passenger names. The offline marshal terminal parses the verified protobuf and displays these fields, allowing the marshal to visually verify physical plates and spot-check government IDs during check-in, preventing screenshot fraud.

```protobuf
syntax = "proto3";

package gridpass.ingress;

// Strict Cryptographic Envelope Pattern to avoid serialization order drift and circular dependencies
message SignedSecurePass {
  bytes serialized_metadata = 1; // Immutable, exact raw bytes of SecurePassMetadata as generated by the server
  bytes ed25519_signature   = 2; // Ed25519 signature generated directly over serialized_metadata
  uint32 signing_key_id     = 3; // Identifies correct public key immediately to prevent trial verification DoS attacks
}

// Inner metadata structure containing compressed user and vehicle check-in specs
message SecurePassMetadata {
  string registration_id   = 1; // Fixed 8-character compact base32 ID
  string event_id          = 2; // Event foreign key (e.g., "sonoma-2026")
  string user_id           = 3; // Skeletal user ID
  string vehicle_id        = 4; // Nullable vehicle ID (omitted if spectator)
  uint64 checked_in_timestamp = 5; // Unix epoch check-in timestamp
  
  enum RunGroup {
    NOVICE      = 0;
    INTERMEDIATE = 1;
    ADVANCED    = 2;
    INSTRUCTOR  = 3;
    SPECTATOR   = 4;
  }
  RunGroup run_group       = 6;
  
  bool waiver_signed       = 7;
  string trailer_plate     = 8; // Nullable plate string (omitted if none)
  bool is_unverified_bypass = 11;
  
  // Passenger Waiver Evasion Loophole Fix (64-bit entropy binary raw bytes)
  repeated bytes passenger_waiver_hashes = 10; // 8-byte raw binary SHA256 waiver hashes for all passengers

  // Screenshot Evasion Guards
  string driver_legal_name = 12;      // Legal name (max 24 characters) for offline ID verification
  string tow_vehicle_plate = 13;      // Primary tow vehicle license plate (max 8 characters)
  repeated string passenger_names = 14; // Legal names of all verified checked-in passengers
}
```

*   **Density Reduction & Performance Calculations**:
    *   *Raw JSON Size*: 270–313 bytes of ASCII text.
    *   *Protobuf Binary Size*: 120–160 bytes (including compact varints, tag numbers, and passenger names).
    *   *Asymmetric Ed25519 Signature*: 64 bytes.
    *   *Total QR Payload Size (SignedSecurePass envelope)*: ~180–225 bytes.
    *   *QR Code Grid Optimization*: By keeping the total binary payload size of the `SignedSecurePass` envelope below 225 bytes, we achieve a **Version 11 QR Code (61x61 module grid, 3,721 dots)** at Level Q error correction. This represents a **48% reduction in module density** compared to the original Version 17/18 grids. The resulting larger physical modules dramatically improve edge-detection algorithms on scanning devices under direct sunlight and high glare, bringing scanning times down to **under 0.5 seconds** and ensuring offline gate scanning resilience.

### 7. Offline Double-Scan Replay Prevention (Marshal App Counter Cache)
*   **The Problem (Screenshot Fraud)**: Paddock gates operate in rural regions with frequent cellular dead zones where marshal scanners must validate check-in passes completely offline (State G). An attendee could easily screenshot a single verified pass and share it with multiple active drivers to bypass registration fees or liability waivers.
*   **The Solution (Marshal App Counter Cache)**: Because scanners cannot perform real-time Firestore database queries, double-scan replay attacks are prevented using a localized scanning app counter cache:
    1.  **Local SQLite/IndexedDB Buffer**: Each marshal's scanning app runs a localized, high-throughput caching database.
    2.  **Pass ID Verification**: When a pass is scanned, the terminal verifies the Ed25519 signature directly over the raw `serialized_metadata` bytes of the `SignedSecurePass` envelope using a pre-cached public key, and only after successful verification parses the payload into `SecurePassMetadata` and extracts the unique `registration_id` and the check-in `timestamp` to check against the local database.
    3.  **Local Counter Increments**:
        ```typescript
        interface ScanCacheRecord {
          registration_id: string;
          scan_count: number;
          first_scanned_at: number; // Unix epoch ms
          last_scanned_at: number;
        }
        ```
    4.  **Replay Warnings**: If the `scan_count` is greater than 0, the scanner instantly flashes a high-contrast **REPLAY WARNING: Pass already scanned!** screen, triggers a continuous vibration haptic alert, and requires the marshal to manually confirm that the towing truck and trailer license plates match the registered vehicle specs on screen.
    5.  **Dual-Pass Lifecycle Temporal Differentiation**: To prevent critical operational lockout collisions under pre-arrival caching and queue mitigation, the scanning terminal enforces a dual-pass lifecycle:
        *   **Pre-Arrival Passes**: Pre-registered driver passes (cached 24 hours prior to the event) are validated for the **entire active duration of the event** (e.g., 24 hours). The terminal relies strictly on the **double-scan replay cache** (SQLite/IndexedDB buffer) to prevent duplicated passes, and the **Screenshot Evasion Guards** (visual verification of driver's name, vehicle plate, and passenger names decoded from the pass metadata and displayed on the marshal terminal) to verify the physical rig matches the pass.
        *   **On-Demand Passes**: Guest and spectator passes generated at the gate via SMS or PWA offline sync are restricted to a strict **30-minute** validity window post-generation to prevent reuse.
    6.  **Local P2P Synchronization & Mesh Offline Mode**: Multiple marshal scanning terminals at adjacent gate lanes synchronize their local counter caches peer-to-peer over a high-efficiency localized WPA3 Wi-Fi mesh network (e.g., `Gridpass-Gate-Local`), ensuring real-time double-scan prevention across lanes even when completely disconnected from the WAN.
    7.  **Mesh Offline Isolated Mode & Handoff**: Large steel transporter rigs and diesel engine blocks frequently interfere with local wireless signals, triggering sync loss. To prevent severe marshal alarm fatigue, a scanner drops mesh synchronization for more than **3 minutes** before officially entering Isolated Mode. Upon sync drop, a silent orange warning banner is displayed rather than triggering loud audio alarms (reserving loud audio alerts strictly for duplicate scans). Under Isolated Mode, the scanner enters an isolated operational state: it forces the marshal to physically tap the matching license plate (read from the tow vehicle or flatbed trailer) as a hard-blocked interactive prompt before manual override is cleared, ensuring visual checks are actively enforced.

### 8. Windshield QR Decal Offline Auditing
*   **Offline Verification**: Windshield QR decals encode a compact, digitally signed binary `SignedSecurePass` representing the vehicle's tech certification and driver waiver status. Marshal scanners verify these decals locally by decoding the envelope and validating the signature over the raw serialized bytes using pre-loaded public keys, enabling complete offline windshield decal auditing without active network connectivity.

---

## 8. Owner's Locked-in Architectural Decisions

To ensure the platform is ready for immediate commercial launch, the following locked-in architectural decisions are integrated directly into the core specification:

### 1. Stripe Connect & Split-Billing Integration
Gridpass utilizes a robust multi-party split-billing engine integrated with Stripe Connect to enable real-time revenue splitting between venue owners, event organizers, and the Gridpass platform. For a detailed breakdown of transaction flows, platform fees, payouts, ledger schemas, and compliance auditing, refer to the comprehensive specification compiled by the Financial AI Agent at:
`c:\_Projects\Gridpass-v4\business_launch\financial_split_billing.md`.

### 2. Vehicle Passport & Gate Camera Scanning
To minimize user typing friction during vehicle declaration (State D), Gridpass integrates free public vehicle specification lookup APIs (using plate or VIN inputs) to automatically pre-populate profile fields like Year, Make, Model, Trim, and Weight.
Additionally, physical gate lanes are integrated with Gate Camera OCR systems. High-resolution OCR cameras capture the vehicle's and trailer's physical license plates on ingress, triggering an automated OCR matching event that resolves the registration and automatically checks-in the driver in Firestore when confidence scores exceed 95%, bypassing manual scanning.

### 3. Gate Operator Auth & Verification
The gate operator scanning app includes dual-mode authentication logic:
1.  **Secure PIN Overlay (High-Security Mode)**: At high-security venues (e.g., NASCAR pits), a secure 4-digit PIN overlay blocks unauthorized operator actions, requiring physical operator pin entry to execute manual bypass check-ins.
2.  **Low-Friction Public Confirmation (Low-Security Mode)**: At low-security environments (e.g., offroad parks), the terminal runs in a low-friction public confirmation view displaying driver waiver and registration status. If a visitor lacks a waiver or registration, the screen displays a prominent red warning card and blocks clearance, routing the visitor to complete the missing requirements.

### 4. Digital Waiver Management
Gridpass implements a dual-integration digital waiver architecture:
1.  **Native E-Sign System**: Built-in signing flow capturing full canvas stroke paths (`signature_strokes`) and hashes stored directly inside the Firestore `waiver_signatures` collection.
2.  **External Third-Party Integrations**: Native support for SmartWaiver verification tokens. When a user completes their waiver on SmartWaiver, a webhook synchronizes a verification token and status to Gridpass, which is written to the user's registration. Offline scanners verify these tokens locally.

### 5. Gridpass Pro & Monetization Strategy
Rather than locking drivers into a rigid monthly recurring subscription model, Gridpass Pro utilizes a high-yield a-la-carte add-on monetization model. Drivers purchase premium items individually:
*   **Premium Physical Artifacts**: High-quality, custom-etched physical metallic QR tags shipped directly to their door for permanent tow vehicle or trailer mounting.
*   **Digital Garage Add-ons**: Premium garage customization options, custom 3D car show layouts, and advanced performance/maintenance telemetry templates.
*   **Pre-purchased Event Bundles**: Single-use lane fast-passes and technical inspection pre-approvals.

