# HANDOFF REPORT

**Milestone 3 (Landing Experience UX Enhancement) - Second Gating Round**
**Working Directory**: `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_challenger_m3_1_gen3`
**Sender**: Challenger 1 (critic, specialist)
**Recipient**: Gen 3 Project Orchestrator (conversation ID: `400f9ac1-a525-4aa7-8457-99fc737be6e0`)

---

## 1. Observation

Direct observations made on `c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md`:

1.  **Spectator Bypass Orange Layout Claim vs Schema reality**:
    *   *Claim (lines 88-90)*: `"All guest passes generated through the spectator bypass path are flagged with an unverified token and require manual, physical government-issued ID checks... The UI is forced into a distinct orange layout displaying UNVERIFIED SPECTATOR - HOLD FOR MANUAL ID CHECK."`
    *   *Schema verification (lines 598-620)*: `RegistrationDocument` contains:
        ```typescript
        export interface RegistrationDocument {
          id: string;                         
          event_id: string;                   
          user_id: string;                    
          vehicle_id: string | null;          
          passenger_registration_ids: string[]; 
          run_group: 'novice' | 'intermediate' | 'advanced' | 'instructor' | 'spectator';
          payment_status: 'paid' | 'pending' | 'exempt';
          waiver_signed: boolean;
          waiver_signature_id: string | null; 
          tech_inspected: boolean;
          tech_inspector: string | null;
          check_in_status: 'pre_registered' | 'checked_in' | 'no_show';
          checked_in_at: Timestamp | null;
          wallet_pass_status: 'not_generated' | 'added' | 'removed';
          cryptographic_signature: string;    
          tow_vehicle_type: 'pickup' | 'suv' | 'commercial' | 'none'; 
          trailer_type: 'none' | 'flatbed' | 'enclosed';              
          tow_vehicle_plate: string | null;                           
          trailer_plate: string | null;                               
          status: 'active' | 'unclaimed' | 'suspended'; 
          type: 'registration';               
        }
        ```
    *   *Result*: There is no `is_unverified_bypass` or `bypass_used` field in the database schema.
    *   *Resolver JSON Schema verification (lines 770-781)*: Under `/api/resolve-tag` `registrationContext` properties, there is only `isRegistered`, `runGroup`, `waiverStatus`, `techStatus`, `checkInStatus`, `trailerPlate`. No field exists for unverified or bypassed sessions.
    *   *Protobuf schema verification (lines 879-899)*: `SecurePassMetadata` includes:
        ```protobuf
        message SecurePassMetadata {
          string registration_id   = 1;
          string event_id          = 2;
          string user_id           = 3;
          string vehicle_id        = 4;
          uint64 checked_in_timestamp = 5;
          RunGroup run_group       = 6;
          bool waiver_signed       = 7;
          string trailer_plate     = 8;
          bytes ed25519_signature  = 9;
        }
        ```
        No unverified or bypass flag is represented in the binary payload.

2.  **Windshield Decal Security Geofencing**:
    *   *API Request Contract (lines 710-713)*: `GET /api/resolve-tag?id=GP-4091-AF8&lat=38.1611&lng=-122.4546` taking `lat` and `lng` as optional query string parameters to verify geofence.
    *   *Result*: Client-provided GPS query parameters are trivially spoofable by an attacker executing raw HTTP calls from anywhere.

3.  **Local Gateway Security**:
    *   *Offline Gateway (lines 866-869)*: `"F. Emergency Marshal Override & Local Zero-Auth Wi-Fi Cache: ... Gate booths host a local, battery-backed offline Wi-Fi access point (e.g., 'Gridpass-Gate-Local') hosting a local captive portal."*
    *   *Result*: The gate gateway is configured as a "Zero-Auth" unencrypted local network, lacking WPA3-Personal or secure HTTPS-only restrictions in its technical specifications.

4.  **Touch Target Heights & Stack spacing**:
    *   *CSS variables (line 165)*: `--btn-touch-target-height: 54px; --btn-secondary-height: 48px;`
    *   *Scenario A vertical spacing (lines 385, 391, 402, 406, 410)*: Buttons are stacked and separated with a minimum of `20px` margins.

5.  **QR Code density calculations**:
    *   *Protobuf & calculations (lines 879-907)*: Shows metadata compressed into a highly compact Protobuf schema resulting in ~160 bytes binary, Base64-encoded to 214 bytes, which fits inside a Version 11 QR code at Level Q error correction (251-byte capacity).

---

## 2. Logic Chain

1.  **Spectator Bypass Evasion**:
    *   Since the `RegistrationDocument`, `/api/resolve-tag` API JSON schema, and `SecurePassMetadata` Protobuf definition do **not** define an `is_unverified` or `bypass` field (Observation 1),
    *   Therefore, the backend is incapable of saving the bypassed state, the API cannot transmit it, and the scanning terminal/client cannot decode it.
    *   Consequently, an unverified bypassed guest registration will appear identical to a fully verified spectator registration in the database and pass.
    *   As a result, a bypassed spectator will bypass the orange manual ID check-in layout, defeating the legal liability waiver checks.

2.  **Decal Privacy Spoofing**:
    *   Since the geofence validation in `/api/resolve-tag` accepts coordinates directly from the client query string parameters (`lat` and `lng`) (Observation 2),
    *   And since coordinate query parameters in an HTTP GET request can be trivially modified or spoofed,
    *   An attacker outside the venue can send Sonoma Raceway's coordinates (`lat=38.1611&lng=-122.4546`) to `/api/resolve-tag` and fully unlock premium vehicle and owner details of any windshield tag.

3.  **MITM Captive Portal Risk**:
    *   Since the local Wi-Fi cache access point is specified as "Zero-Auth" and unauthenticated (Observation 3),
    *   An attacker can trivially spoof the SSID `Gridpass-Gate-Local` using a standard pocket router or laptop,
    *   Intercepting local paddock check-in traffic and harvesting sensitive data such as biometric selfies and signature vectors.

4.  **Fitts's Law Touch Spacing**:
    *   Since stacked buttons have a height of `54px` and a vertical margin gap of `20px` (Observation 4),
    *   Fitts's Law touch simulation models hit and adjacent mis-taps under 16px std dev vibration.
    *   The center-to-center distance is `74px`. Hitting the adjacent button requires a vertical touch error $> 47\text{px}$.
    *   Under 16px std dev, the probability of exceeding $47\text{px}$ is $\approx 0.34\%$.
    *   Compared to the original 12px gap (mis-tap rate $\approx 2.44\%$), the 20px gap yields an **86% reduction in adjacent mis-taps**, confirming Fitts's Law robustness.

5.  **QR Version 11 Readability**:
    *   Since the binary Protobuf payload size is ~160 bytes, Base64 encoding overhead brings it to 214 bytes (Observation 5).
    *   A Version 11 QR code at Level Q (25% error correction) has a capacity of 251 bytes.
    *   The payload fits comfortably with 25% redundant modules.
    *   A Version 11 QR code contains 3,721 modules, representing a 48% reduction in density over Version 17/18 (7,921 modules), which guarantees readability under direct sunlight and glare, validating the SLA.

---

## 3. Caveats

*   **Offline sync database details**: This review evaluated the visual, logical, and technical database schemas in the specification file. It does not evaluate the underlying database trigger functions or server code files since no active server implementation is present in the workspace.
*   **Physical BLE/NFC integration**: We assume the BLE beacons and NFC pads are physically configured as described; physical hardware range tests were out of scope.

---

## 4. Conclusion

**Verdict: 🔴 BLOCKED**

While the Fitts's Law touch target optimizations and QR code Protobuf metadata compression are mathematically robust and successfully addressed, the gating round is **blocked** due to three critical security and data validation loopholes in `join_conversion_ui.md`:
1.  **Spectator Bypass Schema Gap**: Missing `is_unverified_bypass` boolean field in the physical schemas (`RegistrationDocument`, `/api/resolve-tag`, `SecurePassMetadata`), allowing unverified spectators to evade the orange check-in layout.
2.  **Spoofable Client-Side Geofencing**: Windshield decal privacy relies on easily spoofed client-side query coordinates in `/api/resolve-tag`.
3.  **Local Hotspot MITM Vulnerability**: The gate local backup hotspot is defined as a "Zero-Auth" unauthenticated Wi-Fi network, leaving users vulnerable to active SSID spoofing.

---

## 5. Verification Method

To verify these findings and reproduce the adversarial challenges:
1.  Open and inspect `c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md`:
    *   Check lines 598-620 (`RegistrationDocument`) and lines 770-781 (`/api/resolve-tag`) to confirm there is no boolean field representing the "unverified bypass" or "bypass auth" state.
    *   Check lines 710-713 (`/api/resolve-tag` HTTP contract) to confirm coordinate parameters (`lat`, `lng`) are client-supplied URL parameters.
    *   Check lines 866-869 (`Emergency Marshal Override`) to confirm the gateway Wi-Fi is described as a "Zero-Auth" captive portal.
2.  Review the compiled simulation script `c:\_Projects\Gridpass-v4\business_launch\test_ux_and_crypto.py` to inspect the mathematical models for glare relative luminance contrast, Fitts's Law touch vibration errors, and the spectator bypass OTP evasion flow.
