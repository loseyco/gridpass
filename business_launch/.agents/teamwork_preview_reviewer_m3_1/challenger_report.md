# Challenger Report — Adversarial UX/UI Stress Test

**Overall Risk Assessment**: HIGH

---

## Challenge Summary
This adversarial review stress-tests the core assumptions, hardware dependencies, and operational limits of the physical-to-digital ingress funnel proposed in `join_conversion_ui.md`. While the "One-Scan" vision is aesthetically stunning and technically sound under ideal conditions, it exhibits high-risk vulnerabilities under real-world track/trail stresses (direct sunlight glare, non-conductive safety gear, weak cellular signal, and offline hardware scanning).

---

## Challenges

### [High] Challenge 1: The Dark Mirror Effect (Outdoor Sunlight vs. Dark Theme)
- **Assumption Challenged**: The signature dark glassmorphic styling is suitable for high-glare outdoor environments.
- **Attack Scenario**: 
  A user attempts to complete check-in at Rausch Creek Offroad at 12:30 PM under direct sunlight (10,000+ nits). Their smartphone has typical oily fingerprints and dust. The carbon black background (`#060608`) turns the glossy smartphone screen into a literal mirror, reflecting the sky and the user's face. The soft white text (`#f4f4f7`) becomes completely illegible due to poor contrast ratios against high-intensity ambient reflections.
- **Blast Radius**: 
  The driver cannot read the legal waiver or the OTP inputs, causing severe queue backups and eventual abandonment of the digital funnel.
- **Mitigation**: 
  Implement an **Ambient Light Sensory fallback** or a manual header toggle for **"Solar High-Contrast Mode"**. When active, the UI shifts from dark glassmorphic to a pure, flat light theme: background `#ffffff`, text `#000000`, card borders `#000000` (thick 2px), and high-saturation primary colors.

### [High] Challenge 2: The Glove Capacitance Barrier
- **Assumption Challenged**: Touch targets scaled to `54px` solve "glove-wearing check-ins."
- **Attack Scenario**: 
  An offroad driver in a Polaris RZR or a track driver strapped into a Porsche GT3 is wearing heavy, non-conductive Nomex or utility work gloves. They scan the QR code and try to tap the `54px` primary buttons. Because capacitive touchscreens require skin contact (or conductive fabrics), the phone does not register the touch at all, regardless of the visual button size.
- **Blast Radius**: 
  Complete operational block. Drivers are forced to unstrap, remove their gloves in dirty/muddy conditions, or abandon the process.
- **Mitigation**: 
  1. Add warning micro-copy explicitly prompting the driver: *"Please use a touchscreen-compatible finger or remove gloves to proceed."*
  2. Implement **Zero-Touch Auto-Ingress**: If a user is already registered for the event and has signed their waiver, scanning the gate QR code should automatically resolve their identity and immediately render their QR pass at full screen *without requiring any secondary button taps or confirmations*.

### [Medium] Challenge 3: Ingress Gridlock due to Delayed SMS OTP in Rural Valleys
- **Assumption Challenged**: SMS OTP is a reliable verification mechanism in weak-signal environments.
- **Attack Scenario**: 
  A racetrack (e.g., Virginia International Raceway) is located in a rural area with highly congested or weak cellular towers (1 bar of 1xRTT/LTE). The user scans the QR code. The webpage loads slowly (via simplified assets), but the Twilio-dispatched SMS OTP is queued by the cellular carrier and delayed by 5–10 minutes.
- **Blast Radius**: 
  A single driver stuck waiting for an SMS code blocks the paddock gate lane, creating a multi-car gridlock onto the public highway.
- **Mitigation**: 
  1. Set up a local, zero-auth Wi-Fi network at the gate that hosts a local caching node of the check-in web app.
  2. Implement an **"Emergency Marshal Override"** button on the welcome page that lets spectators/drivers self-attest their registration offline or bypass to a static Spectator Pass, caching the session state locally in browser `localStorage` to sync once cellular service stabilizes.

### [Medium] Challenge 4: Offline Bypass & Decal Duplication Fraud
- **Assumption Challenged**: Static physical windshield decals can be verified offline by marshals.
- **Attack Scenario**: 
  The gate marshal is running completely offline because track network infrastructure failed. A driver approaches towing a rig. The vehicle has a static printed decal on the windshield with a QR code (representing a static `tagId`). The marshal scans the sticker. Since they are offline, they cannot query Firestore. A malicious user could easily copy or photograph another member's windshield decal, print it, or show a photo of it on a phone, bypassing the $250 registration fee entirely.
- **Blast Radius**: 
  High risk of unauthorized entry and waiver bypass during network blackouts.
- **Mitigation**: 
  1. The marshal's scanner app MUST pre-sync a local encrypted cache of all active registrants and their associated `tagId`s before the event begins.
  2. Under offline scenarios, marshals must scan the **Dynamic Apple/Google Wallet Pass** rather than the physical windshield sticker. The Wallet pass contains the `cryptographic_token` (a dynamic hash verifying registration state and waiver sign-off) which can be decrypted and verified offline using public key pairs.

---

## Stress Test Results

| Scenario | Expected Behavior | Actual/Predicted Behavior | Result |
|:---|:---|:---|:---|
| **Direct Sunlight Glare** | 100% legibility of waivers & buttons. | High reflection on carbon black slate; text unreadable. | **FAIL** |
| **Gloved Input (Capacitive)** | Rapid button taps via scaled 54px targets. | Tap completely ignored due to non-conductive gloves. | **FAIL** |
| **Weak Cell Signal (SMS OTP)** | OTP code received within 15 seconds. | High carrier queue latency; delayed delivery blocks gate. | **FAIL** |
| **Decal Scanning (Offline)** | Scanner instantly verifies registration. | Static QR code cannot verify active registration without server. | **FAIL** |

---

## Unchallenged Areas
- **Payment Processing (Stripe Integration)**: Payment routing and B2B connect fee structures were excluded from the scope as they are handled in backend microservices rather than the landing experience UI.
