# Milestone 3 Synthesis & Consensus Report — Mobile QR Landing Experience

## 1. Catalog of Inputs & Core Focus Areas
This report reconciles the research, visual layouts, and dynamic parameter mappings from three independent Explorer agents to establish the definitive UX and architectural optimization specification for the `gridpass.app/join` physical QR scanning conversion funnel.

*   **Explorer 1 (UX Flow & Onboarding Journey)**: Analyzed authentication friction (email/password loops), mobile app switching context drop-off, cellular signal degradation at rural tracks, and proposed a streamlined B2C towing registration journey with dynamic SMS OTP verification and Apple/Google Wallet offline pass delivery.
*   **Explorer 2 (Mobile UI Visual Schema & Viewports)**: Researched codebase design tokens in `globals.css` (slate backgrounds, glassmorphism card styling, primary HSL variables), mobile web viewports (375px–420px grid layout limits), and defined co-branded visual variables and touch target densities.
*   **Explorer 3 (Metadata Mapping & Database Schema)**: Defined structured Firestore database schemas (tags registry, venues/businesses, events, registrations, check-ins, waiver signatures) and developed the standard JSON payload schema for server-side route resolving.

---

## 2. Consensus & Unified Specifications

### A. The Mobile-First Ingress Journey (Consensus)
All sources agree that drivers sitting in idling vehicles in a paddock check-in lane must clear the gate in **under 5 seconds** with **zero technical friction**. 
1.  **Context preservation**: The user must never be redirected to a generic login or credential-setup page. The entire experience must take place within the active `/join` browser webview.
2.  **SMS OTP Verification**: Swapping email-based authentication for a single SMS phone number verification field keeps the user in the browser window, avoiding background tab purging.
3.  **Visual "Fast-Pass" Clearances**: A high-impact status card showing a large pulsing verification dot allows paddock marshals to visually clear vehicles from 10 feet away.
4.  **Offline Pass Delivery**: Adding the generated gate ticket to Apple Wallet or Google Wallet is the ultimate B2B2C conversion mechanism, ensuring the user can display their ticket even when cellular reception is completely lost.

### B. Viewport & Design Systems
The UI must strictly align with the codebase's existing dark glassmorphic styling, defined in `src/app/globals.css`:
*   **Background Theme**: Carbon Black Slate (`#060608`)
*   **Responsive Widths**: Optimized for `375px–420px` viewports with single-column stack elements to ensure no horizontal scrollbars.
*   **Touch Targets**: Core buttons scaled to `54px` (primary) and `48px` (secondary) with high-contrast active states to facilitate interaction for users wearing racing/riding gloves or standing in bright sunlight.
*   **Ambient Styling Hooks**: Dynamic branding is injected using custom HSL properties (`--partner-primary`, `--partner-accent`, `--partner-glow-hsl`) to dynamically adjust the underlying `.mesh-glow` radial gradient, instantly reflecting the partner's brand identity.

### C. Database & Data Model Schemas
The dynamic URL `gridpass.app/join?id=xxxx` must resolve via a tags database using these exact structures:
*   **`tags` registry**: Binds a dynamic QR code ID to its target type (`vehicle`, `user`, `venue_gate`, `event`, or `unclaimed`).
*   **`venues` / `businesses`**: Outlines B2B partner records (logo, branding, location, coordinates).
*   **`events`**: Details date, schedules, run groups, and waiver requirements.
*   **`registrations` / `check_ins`**: Core intersection record connecting a user, vehicle, run group, and event check-in state.
*   **`waiver_signatures`**: Digitally hashes IP, selfie URL, signed name, and date.

---

## 3. Resolved Conflicts & Strategy Decisions

*   **Conflict: Inline Manual Input vs Fast-Pass Declaration**: 
    *   *Initial Disagreement*: Standard forms require detailed manual entry of Year, Make, Model, and Trim for every asset.
    *   *Resolution*: For paddock scanning, towing rigs often consist of multiple assets (tow truck, trailer, race vehicle). The UI will utilize a streamlined **Rig & Tow Cargo Declaration** grid (Pickup/SUV -> Enclosed/Flatbed -> HPDE/OHV/Dirtbike) alongside lightweight client-side camera OCR for trailer plate auto-filling, rather than tedious mobile typing.
*   **Conflict: Native Database Queries vs Offline Verification**:
    *   *Initial Disagreement*: Attendant checking requires real-time read/write sync with Firestore.
    *   *Resolution*: In dead-zone tracks, real-time Firestore queries will fail. The system will leverage geofenced Apple/Google Wallet Passes displaying cached barcode tokens derived from a unique cryptographically signed registration token that the attendant can scan offline.

---

## 4. Unresolved Dissenting Views
*   None. All three Explorers reached solid alignment on visual, architectural, and data modeling strategies.

---

## 5. Identified Gaps (Future Implementation Tasks)
*   **SMS Gateway API**: Integration with a dynamic SMS dispatcher (e.g. Twilio API route) to handle OTP verification tokens.
*   **Asymmetric Cryptography Service**: A backend routine to generate cryptographic check-in hashes (`cryptographic_token`) for the offline barcode scanner.
*   **PassKit Bundle Generation**: Server-side logic compiling custom `.pkpass` files containing location coordinates and styling variables.
