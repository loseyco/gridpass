# Milestone 3 Explorer Handoff: Mobile UI Layout & Co-Branding Visual Schema Exploration

## 1. Observation
We have systematically investigated the visual assets, layout structure, and styling frameworks in the Gridpass-v4 codebase:
- **`src/app/globals.css`** (lines 3-18, 71-104, 133-144) defines the core design tokens:
  - Background: `#060608` (Dark Slate Black)
  - Text Foreground: `#f4f4f7` (Soft Grey-White)
  - Core Brand HSL: Primary Blue (`--brand-primary`: `217 91% 60%`), Accent Green (`--brand-accent`: `160 84% 45%`), Neon Cyan (`--brand-neon`: `195 100% 50%`)
  - Layout Utilities:
    - `.mesh-glow`: Radial gradients blurring Cyan/Blue/Emerald behind components to create a deep, premium depth.
    - `.glass-card`: Glassmorphism with `backdrop-filter: blur(16px)`, translucent border, and subtle drop shadow.
    - `.glass-input`: Translucent inputs with high contrast active state.
    - `.btn-glow`: Animated horizontal shine overlay.
- **`src/app/join/page.tsx`** (lines 13-149) handles physical QR scan landing parameters:
  - Resolves tag IDs (`gridpass.app/join?id=XXXX`) and queries three Firestore collections: `vehicles`, `businesses`, and `users`.
  - Attributes the scan's geolocation coordinates (via `navigator.geolocation.getCurrentPosition`) for telemetry and geo-analytics.
  - Redirects matched tags to target profile paths: `/v/${vehicleId}`, `/b/${businessId}`, or `/u/${userId}`.
  - Standardizes the unclaimed state (lines 224-297) where visitors are prompted to sign in or create an account to bind the QR tag to their digital garage.
- **`src/app/v/[id]/page.tsx`** (lines 199-401) implements the vehicle profile view:
  - Custom lifetime upgrade monetization block (`Upgrade Lifetime Profile $29.99` with Crown badge and animated CTA).
  - Responsive grids for vehicle telemetry, VIN verification status, and an interactive Firestore-backed maintenance history logger with customizable title and notes input forms.

---

## 2. Logic Chain
Based on these observations, the visual design strategy for dynamic B2B2C co-branded landing experiences must integrate seamlessly with the existing dark glassmorphic layout while providing rapid customization hooks for individual venues, offroad parks, and regional car clubs.

```
       +---------------------------------------------+
       |   Codebase Theme: Dark Glassmorphic Grid    |
       |  (globals.css: bg-[#060608], .glass-card)   |
       +----------------------+----------------------+
                              |
                              v
       +---------------------------------------------+
       |   Dynamic Custom Style Injections (CSS Var) |
       | --partner-primary, --partner-glow-opacity   |
       +----------------------+----------------------+
                              |
                              v
       +---------------------------------------------+
       |   Responsive Layout Rules (375px - 420px)   |
       |   Single-Column Flex-Col, 48px-54px Touch   |
       +----------------------+----------------------+
                              |
       +----------------------+----------------------+
       |                      |                      |
       v                      v                      v
+--------------+      +--------------+      +--------------+
|  Scenario A  |      |  Scenario B  |      |  Scenario C  |
| Tracks/HPDE  |      |   OHV Parks  |      |   Car Clubs  |
+--------------+      +--------------+      +--------------+
```

1. **Brand Blending via CSS Variables**: Rather than compiling isolated CSS stylesheets for each partner, Gridpass can achieve highly-performant B2B2C layout customization by dynamically injecting HSL-based CSS custom properties in the document root or parent container.
2. **Ambient Mesh Customization**: By overriding the colors inside the `.mesh-glow` wrapper with the partner's primary brand HSL variables, the background immediately transforms to reflect the partner's aesthetic (e.g. red for racing circuits, orange for OHV parks, neon-cyan for car clubs) while preserving the signature dark glassmorphic styling.
3. **Viewport Optimization (375px-420px)**: The standard mobile web viewport demands:
   - **Horizontal Constraints**: High density single-column spacing (`px-4`, 16px lateral borders) leaving exactly `343px` (on a 375px screen) for content to ensure no layout breakages or horizontal overflows.
   - **Rhythm & Gaps**: Standardized vertical layout gaps (`space-y-4` / 16px) with condensed paddings inside nested elements to maximize content visibility above the fold.
   - **Touch Target Density**: Primary action buttons scaled to `54px` height with explicit focus indicators, optimizing interaction for outdoor sunlight, high-glare environments, or users wearing driving/riding gloves.
   - **Typographic Scale Hierarchy**: Maximizes instant contrast and legibility under intense outdoor glare:
     - Logo Subtitle: `text-[10px] tracking-widest font-black uppercase`
     - Page Title: `text-3xl font-black tracking-tighter text-white leading-none`
     - Action Cards: `text-xs uppercase font-extrabold tracking-wider text-neutral-400`
     - Core Body Details: `text-sm font-medium leading-relaxed text-neutral-300`
     - Tech/Serial Codes: `text-[10px] font-mono font-bold text-neutral-500`

---

## 3. Caveats
- **Offline / Remote Coverage**: Offroad and adventure parks are frequently located in remote geographic regions with low or spotty cellular coverage. The landing UI must degrade gracefully, utilizing native offline cache manifests or Service Workers to display pre-fetched park layout maps or static safety instructions even if the Firestore sync fails.
- **Dynamic Barcodes**: Displaying gate check-in barcodes requires client-side javascript rendering libraries (e.g. `JsBarcode`). If these fail to load, the UI must fallback instantly to rendering a large-font, highly visible alphanumeric string (`GP-SONOMA-4091-AF8`) that the gatekeeper can manually type.
- **Waiver API Integrations**: Direct integration with external track waiver systems (e.g. SpeedWaiver, TrackWaiver) is assumed to happen via a background webhook. In the layout, this is represented by an active state banner, but the implementation agent will need to handle actual API handshakes or secure deep-links.

---

## 4. Conclusion: Technical Visual Layout Blueprints

### A. Co-Branding Visual Schema & Variable Model
To implement dynamic branding, the React page wrapper or local theme state binds the following custom property model fetched from the partner's registry profile:

```json
{
  "partner_id": "sonoma-raceway",
  "name": "Sonoma Raceway",
  "logo_url": "/assets/logos/sonoma.png",
  "theme": {
    "primary_color": "#e21a22",
    "primary_hsl": "358 79% 50%",
    "accent_color": "#ffffff",
    "glow_color": "358 79% 35%",
    "glow_opacity": "0.18"
  },
  "configurations": {
    "waiver_required": true,
    "tech_sheet_required": true,
    "offline_assets": ["/maps/sonoma-paddock.pdf"]
  }
}
```

#### CSS Layout Integrations (`src/app/globals.css` Extensions)
```css
/* Dynamic Partner Styling Hooks */
:root {
  --partner-primary: var(--brand-primary);
  --partner-primary-hsl: 217 91% 60%;
  --partner-accent: #ffffff;
  --partner-glow-hsl: 217 91% 40%;
  --partner-glow-opacity: 0.15;
}

/* Dynamically Overridden Mesh Background */
.partner-mesh-glow {
  position: absolute;
  top: -10%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 500px;
  background: 
    radial-gradient(circle at 25% 15%, hsl(var(--partner-primary-hsl) / var(--partner-glow-opacity)) 0%, transparent 45%),
    radial-gradient(circle at 75% 55%, hsl(var(--partner-glow-hsl) / 0.1) 0%, transparent 50%);
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}

/* Adaptive UI Components */
.btn-partner-primary {
  background-color: var(--partner-primary);
  color: var(--partner-accent);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.btn-partner-primary:hover {
  filter: brightness(1.1);
  box-shadow: 0 0 20px hsl(var(--partner-primary-hsl) / 0.25);
}

.border-partner-accent {
  border-color: hsl(var(--partner-primary-hsl) / 0.2);
}
.border-partner-accent:hover {
  border-color: var(--partner-primary);
}

.text-partner-accent {
  color: var(--partner-primary);
}
```

---

### B. Viewport Layout Blueprints (375px - 420px width)

#### Layout Blueprint 1: Tracks & Racing Circuits (Towing & Paddock Gate Check-In)
- **Visual Design Objectives**: Giant tap zones, instant green verification status (visible through windshield / phone mount), bright barcode scanner compatibility, and quick-access tech check lists.
- **Color Accent**: Racing Red (`#e21a22`)

```
+-------------------------------------------------+
|  [GP Mini-Logo]           x         [Sonoma Logo] |  <- Header (48px flex-row, items-center)
+-------------------------------------------------+
|                                                 |
|  WELCOME TO SONOMA RACEWAY!                     |  <- text-3xl font-black tracking-tighter
|  HPDE TRACK ENTRY TERMINAL                      |  <- text-xs text-neutral-400 tracking-wider
|                                                 |
|  +-------------------------------------------+  |
|  | [V] WAIVER SIGNED & COMPLETED             |  |  <- .glass-card, border-emerald-500/25
|  | Track Check-In: APPROVED                  |  |  <- text-emerald-400 font-bold
|  | Attributed: 2026-05-22 10:37 UTC          |  |  <- text-[10px] text-neutral-500
|  +-------------------------------------------+  |
|                                                 |
|  +-------------------------------------------+  |
|  | VEHICLE SPECIFICATIONS                    |  |  <- text-[10px] text-neutral-400 uppercase
|  |  Specs: 2021 Porsche 911 GT3              |  |  <- text-xs text-neutral-200
|  |  Class: HPDE Group 3 (Advanced)           |  |
|  |  Tech:  [APPROVED] Self-Tech Verified     |  |  <- text-emerald-400 font-bold
|  +-------------------------------------------+  |
|                                                 |
|  +-------------------------------------------+  |
|  |                                           |  |
|  |            [ GATE PASS BARCODE ]          |  |  <- High contrast layout container
|  |            ||||| | |||| |||| ||           |  |
|  |            GP-SONOMA-4091-AF8             |  |  <- text-[10px] font-mono text-neutral-400
|  |                                           |  |
|  +-------------------------------------------+  |
|                                                 |
|  +-------------------------------------------+  |
|  | PRESENT TO GATE KEEPER FOR SCANNING       |  |  <- Primary CTA: bg-[#e21a22], H=54px
|  +-------------------------------------------+  |
|                                                 |
|  +-------------------------------------------+  |
|  | SUBMIT NEW VEHICLE TECH SHEET             |  |  <- Secondary CTA: Glass Border, H=50px
|  +-------------------------------------------+  |
|                                                 |
|  Gridpass Network v4 (Telemetry Registry)        |  <- Footer: text-[9px] text-neutral-600
+-------------------------------------------------+
```

#### Layout Blueprint 2: Offroad & Adventure Parks (Glared Trails & OHV Permit Registry)
- **Visual Design Objectives**: Rugged contrast layout, day-pass validity countdown timers, safety flags/equipment warnings, and offline trail map downloads.
- **Color Accent**: Trail Orange (`#d97706`)

```
+-------------------------------------------------+
|  [GP Mini-Logo]           x      [Rausch Creek] |  <- Header (48px flex-row, items-center)
+-------------------------------------------------+
|                                                 |
|  RAUSCH CREEK OFFROAD PARK                      |  <- text-3xl font-black tracking-tighter
|  OHV VEHICLE ENTRY GATE                         |  <- text-xs text-neutral-400 tracking-wider
|                                                 |
|  + ! SAFETY FLAG REQUIRED ON ALL VEHICLES ! -+  |  <- Warning Banner: Yellow-border, bg-red-950/20
|  | All OHVs must fly a 10ft orange safety whip.  |  <- text-xs text-yellow-500
|  +-------------------------------------------+  |
|                                                 |
|  +-------------------------------------------+  |
|  | PASS STATUS: [ ACTIVE DAY PASS ]          |  |  <- Highlight: Trail Orange bg-orange-600/10
|  | Expiration: Today at 6:00 PM (EDT)        |  |  <- text-xs text-neutral-200
|  | Time Remaining: 7 Hours, 22 Mins          |  |  <- text-orange-400 font-bold
|  +-------------------------------------------+  |
|                                                 |
|  +-------------------------------------------+  |
|  | OHV PERMIT REGISTRY                       |  |  <- Grid: specs metadata
|  |  Vehicle ... 2023 Polaris RZR XP 1000     |  |
|  |  Permit .... PA-OHV-9821-XP               |  |
|  |  Riders .... 2 (Waivers Verified)         |  |
|  +-------------------------------------------+  |
|                                                 |
|  +-------------------------------------------+  |
|  | SHOW RANGER DAY PASS                      |  |  <- Primary CTA: bg-[#d97706], H=54px
|  +-------------------------------------------+  |
|                                                 |
|  +-------------------------------------------+  |
|  | DOWNLOAD OFFLINE TRAIL MAP (PDF)          |  |  <- Secondary CTA: Glass Border, H=50px
|  +-------------------------------------------+  |
|                                                 |
|  Gridpass Network v4 (Telemetry Registry)        |
+-------------------------------------------------+
```

#### Layout Blueprint 3: Enthusiast Car Clubs & Regional Organizers (Showcase Display & Engagement)
- **Visual Design Objectives**: Premium aesthetic carbon black styling, dynamic showcase image placement, custom specs dashboard (horsepower, dyno sheets, engine modifications), and visitor peer-voting buttons.
- **Color Accent**: Sleek Neon Cyan (`#06b6d4`)

```
+-------------------------------------------------+
|  [GP Mini-Logo]           x      [Elite Club]   |  <- Header (48px flex-row, items-center)
+-------------------------------------------------+
|                                                 |
|  ELITE CARS & COFFEE                            |  <- text-3xl font-black tracking-tighter
|  REGIONAL DISPLAY GARAGE                        |  <- text-xs text-neutral-400 tracking-wider
|                                                 |
|  +-------------------------------------------+  |
|  | DISPLAY CAR REGISTERED                    |  |  <- Header Badge: Cyan glow accent
|  | Space #142 (Main Paddock Boulevard)       |  |  <- text-xs text-neutral-200
|  +-------------------------------------------+  |
|                                                 |
|  +-------------------------------------------+  |
|  | VEHICLE GARAGE SPECIFICATIONS             |  |  <- text-[10px] text-cyan-400 uppercase
|  |  Model: 2018 BMW M3 Competition           |  |  <- text-xs font-bold text-white
|  |  Power: 510 WHP (Dyno Verified)           |  |
|  |  Mods:  Akrapovic, KW V3, CSF Cooler      |  |
|  |  Garage: gridpass.app/v/bmw-m3-comp       |  |  <- text-[10px] text-neutral-500
|  +-------------------------------------------+  |
|                                                 |
|  +-------------------------------------------+  |
|  | VIBE CHECK LEADERBOARD                    |  |  <- Flex column spec list
|  |  1. 1993 Mazda RX-7 FD (142 Votes)        |  |
|  |  2. 2018 BMW M3 Competition (98 Votes)    |  |  <- Bold active vehicle highlight
|  +-------------------------------------------+  |
|                                                 |
|  +-------------------------------------------+  |
|  | VOTE FOR THIS DISPLAY CAR                 |  |  <- Primary CTA: bg-[#06b6d4], H=54px
|  +-------------------------------------------+  |
|                                                 |
|  +-------------------------------------------+  |
|  | JOIN PRIVATE CLUB FORUM & DIRECTORY       |  |  <- Secondary CTA: Glass Border, H=50px
|  +-------------------------------------------+  |
|                                                 |
|  Gridpass Network v4 (Telemetry Registry)        |
+-------------------------------------------------+
```

---

## 5. Verification Method

### A. Viewport Testing Command (Responsiveness Sandbox)
To verify layout rendering and custom styling, direct the implementing worker agent to add a temporary mock sandbox route at `src/app/join/sandbox/page.tsx` and run:
```powershell
npm run dev
```
Navigate to `http://localhost:3000/join/sandbox` and use the Chrome/Firefox Developer Tools (F12) Device Emulation toolbar:
1. Select **iPhone SE** (375px viewport width) and verify no horizontal scrollbars occur.
2. Select **Pixel 7** (412px viewport width) and verify that borders, dynamic mesh backgrounds, and text scale cleanly without wrapping anomalies.
3. Simulate outdoor glare by setting high-contrast accessibility parameters in your browser and check contrast ratio passes WCAG AA (>= 4.5:1).

### B. Layout Verification Checklist
- [ ] Custom CSS Variables (`--partner-primary`, `--partner-accent`, `--partner-glow-hsl`) load correctly inside the document root style tag.
- [ ] Active touch components measure at least `48px` (secondary) and `54px` (primary action targets) to prevent misclicks in high-vibration/glove-wearing conditions.
- [ ] Ambient background `.mesh-glow` overlays dynamically match the partner color variables without blocking page text contrast.
- [ ] Geolocation query falls back seamlessly within 3.5 seconds if permissions are denied or cell signal is lost.
