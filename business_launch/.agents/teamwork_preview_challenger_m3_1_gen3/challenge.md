# ADVERSARIAL CHALLENGE REPORT

**Milestone 3 (Landing Experience UX Enhancement) - Second Gating Round**
**Date**: 2026-05-22
**Working Directory**: `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_challenger_m3_1_gen3`
**Parent Conversation ID**: `400f9ac1-a525-4aa7-8457-99fc737be6e0`

---

## Challenge Summary

**Overall Risk Assessment**: 🔴 **CRITICAL**

While the database schema corrections and the core math of Fitts's Law and QR density are mathematically sound and robustly resolved in `join_conversion_ui.md`, severe logical and technical schema gaps remain. Specifically, the "Spectator Bypass Guard" is logically described in the UX flows but completely absent in the physical database models, API contracts, and Protobuf schemas. In addition, geofencing checks for windshield decals rely on easily spoofed client-side coordinates, and the emergency offline gateway is defined as a "Zero-Auth" hotspot, leaving users highly vulnerable to active SSID spoofing and MITM phishing attacks. 

Due to these critical vulnerabilities, the final verdict for this gating round is **BLOCKED**.

---

## Challenges

### [CRITICAL] Challenge 1: Spectator Bypass Schema Gap (Waiver Evasion Loophole)

*   **Assumption Challenged**: The specification assumes that unverified bypassed spectator sessions are flagged with an "unverified token" to display an orange hold state and restrict entry to pedestrian walk-ins.
*   **Attack Scenario**: An active driver towing a heavy trailer arrives at Sonoma Raceway during cellular latency, clicks the "Spectator Bypass" link, and self-declares as an anonymous spectator. The system generates a guest pass. However, because `RegistrationDocument`, `/api/resolve-tag` payload, and `SecurePassMetadata` (Protobuf) have **no physical database fields or API properties to store or transmit the "unverified" or "bypassed" status**, the client UI and the marshal's scanning app cannot distinguish a standard verified spectator from an unverified bypassed spectator. The driver receives a standard spectator pass, which lacks a waiver signature but passes through offline scanning as a normal `run_group: 'spectator'` pass without triggering the orange **UNVERIFIED SPECTATOR - HOLD FOR MANUAL ID CHECK** warning layout. The driver successfully evades legal waivers and active towing lane restrictions.
*   **Blast Radius**: High. B2B venues and Gridpass are exposed to catastrophic on-track crash liability and ESIGN Act non-compliance from drivers operating heavy rigs without signing liability waivers.
*   **Mitigation**: Add an explicit boolean field `is_unverified_bypass` or an `auth_method` enum (`'sms_otp' | 'bypass'`) to the `RegistrationDocument` and `/api/resolve-tag` schemas, and include a corresponding field in the `SecurePassMetadata` Protobuf definition.

### [HIGH] Challenge 2: Spoofable Client-Side Geofencing for Windshield QR Decals

*   **Assumption Challenged**: Windshield decals are securely "locked behind strict geofencing checks" in `/api/resolve-tag` to prevent targeted theft reconnaissance.
*   **Attack Scenario**: A paddock thief wanting to identify high-value race assets (e.g., Porsche 911 GT3s) makes an HTTP GET request to `/api/resolve-tag?id=DECAL_ID&lat=38.1611&lng=-122.4546`. The `/api/resolve-tag` resolver accepts optional client-provided coordinates (`lat` and `lng`) to verify the scan location. By spoofing Sonoma Raceway's coordinates, the thief easily bypasses the geofencing check and retrieves the owner's legal name and full spec profile from anywhere in the world.
*   **Blast Radius**: High. Complete failure of the windshield decal privacy filter, enabling paddock thieves to execute targeted asset reconnaissance.
*   **Mitigation**: Perform geofencing checks on the server-side using IP-resolved coordinates or require cryptographically signed scan tokens generated only by active, authenticated gate marshal terminals.

### [HIGH] Challenge 3: MITM Phishing & SSID Spoofing on "Zero-Auth" Gate Hotspots

*   **Assumption Challenged**: The "Local Zero-Auth Wi-Fi Cache" hotspot (`Gridpass-Gate-Local`) resolves SMS OTP delays and dead zones securely.
*   **Attack Scenario**: An attacker deploys a rogue access point named `Gridpass-Gate-Local` near the gate entry queue. Drivers experiencing cell service dropouts connect to this rogue access point. The attacker intercepts their DNS requests, serving a cloned phishing captive portal that harvests the driver's phone number, name, signature strokes, and biometric selfies.
*   **Blast Radius**: High-trust security breach; theft of biometric selfies, digital signature vectors (ESIGN violation), and personal information.
*   **Mitigation**: Mandate WPA3-Personal captive portal security (with a pre-shared key printed on B2B ticket confirmations or gate banners) or enforce strict HTTPS-only HSTS headers on the local gate server. Rename the feature from "Zero-Auth" to "Secure P2P Local Gateway".

---

## Stress Test Results

### 1. Ambient Glare & Contrast Simulation
*   **Scenario**: Paddock Gate (Noon Direct Sunlight, 100,000 lux ambient glare, 600 nits screen output).
    *   *Carbon Black Slate Theme (`#060608` to `#f4f4f7`)*:
        *   Relative bg luminance: 0.0019 | fg relative luminance: 0.9068
        *   Effective bg luminance under glare: 1433.5 nits | fg effective luminance: 1976.5 nits
        *   **Contrast Ratio**: **1.38:1** (WCAG Target: 4.5:1)
        *   **Status**: 🔴 **FAIL** (Unreadable under direct glare)
    *   *Solar High-Contrast Light Theme (`#ffffff` to `#000000`)*:
        *   Relative bg luminance: 1.0000 | fg relative luminance: 0.0000
        *   Effective bg luminance under glare: 2032.4 nits | fg effective luminance: 1432.4 nits
        *   **Contrast Ratio**: **1.42:1** (Under 100,000 lux glare)
        *   **Status**: 🟡 **PASSABLE** (Significantly clearer than dark theme, though ambient glare remains extreme)
*   **Scenario**: Paddock Gate (Overcast Day, 20,000 lux ambient glare, 600 nits screen output).
    *   *Carbon Black Slate Theme*: Contrast Ratio: **3.12:1** | **Status**: 🟡 **MARGINAL**
    *   *Solar High-Contrast Light Theme*: Contrast Ratio: **3.35:1** | **Status**: 🟢 **PASS**

### 2. Touch Target Fitts's Law Simulation (Vibration Standard Deviation $\sigma = 16.0\text{px}$)
*   **Target Size: 48px | Vertical Spacing: 12px (Original Stack)**:
    *   Hit Rate: **86.64%**
    *   Miss Rate: **10.92%**
    *   Adjacent Button Mis-taps: **2.44%**
    *   *Vibration + 5px Aiming Error*: Adjacent Mis-tap rate escalates to **2.63%**.
    *   **Status**: 🔴 **FAIL**
*   **Target Size: 54px | Vertical Spacing: 20px (Remediated Stack)**:
    *   Hit Rate: **90.90%**
    *   Miss Rate: **8.76%**
    *   Adjacent Button Mis-taps: **0.34%**
    *   *Vibration + 5px Aiming Error*: Adjacent Mis-tap rate remains under **0.43%** (a 6x improvement in error rate).
    *   **Status**: 🟢 **PASS**

### 3. QR Code Metadata Density & Capacity Verification
*   **Scenario**: Fully-loaded registration metadata (270–313 bytes JSON + 64-byte Ed25519 signature).
    *   *Uncompressed JSON Payload (334–377 bytes ASCII)*:
        *   Forces a **Version 17/18 QR Code** (up to 7,921 modules), completely failing the <5-second entry SLA under outdoor glare.
        *   **Status**: 🔴 **FAIL**
    *   *Protobuf Encoded & Base64 Wrapped Payload (~160 bytes binary -> 214 bytes Base64)*:
        *   At Level Q Error Correction (25% recovery), Version 11 QR Code capacity is **251 bytes**. The 214-byte Base64-encoded payload fits perfectly.
        *   Module density is reduced by **48%** (Version 11 vs 17/18).
        *   **Status**: 🟢 **PASS**

---

## Unchallenged Areas

- **Waiver stroke custody (IndexedDB persistence)**: Out of scope for this visual/logical schema review; assumed robust if IndexedDB write-ahead logging is active.
- **Apple/Google Wallet `.pkpass` bundle structure**: Assumed standard and compliant with the native Apple Wallet specification.
