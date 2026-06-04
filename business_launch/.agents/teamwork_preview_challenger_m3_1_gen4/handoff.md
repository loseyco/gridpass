# HANDOFF REPORT — Milestone 3 Gating Round 3

## 1. Observation
I directly observed the following within `c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md`:
*   **API / DB Schema Mismatch**:
    *   In the `RegistrationDocument` interface (lines 597–621), the spectator bypass flag is defined as:
        ```typescript
        619:   is_unverified_bypass: boolean; // Flag identifying unverified guest spectator bypass sessions
        ```
    *   In the `/api/resolve-tag` JSON schema (lines 716–786), the field is defined as camelCase:
        ```json
        779:         "isUnverifiedBypass": { "type": "boolean" }
        ```
        And is marked as required in the schema:
        ```json
        781:         "required": ["isRegistered", "waiverStatus", "techStatus", "checkInStatus", "isUnverifiedBypass"]
        ```
    *   Additionally, the `RegistrationDocument` specifies towing parameters (lines 613-616):
        ```typescript
        613:   tow_vehicle_type: 'pickup' | 'suv' | 'commercial' | 'none'; // Declared tow vehicle type to prevent data loss
        614:   trailer_type: 'none' | 'flatbed' | 'enclosed';              // Declared trailer configuration
        615:   tow_vehicle_plate: string | null;                           // Declared tow vehicle plate scanned or captured via OCR
        ```
        However, the `/api/resolve-tag` JSON schema `registrationContext` (lines 770–782) completely omits `towVehicleType`, `towVehiclePlate`, and `trailerType`, containing only `trailerPlate`.
*   **Geofencing Client Spoofing**:
    *   The HTTP Query Contract for `/api/resolve-tag` (lines 710–714) takes `lat` and `lng` query parameters:
        ```markdown
        710: *   Request URL: `GET /api/resolve-tag?id=GP-4091-AF8&lat=38.1611&lng=-122.4546`
        ```
*   **Ambient Light & Glare Specs**:
    *   The specification states that Solar Light Mode switches color variables to pure black (`#000000`) and pure white (`#ffffff`) (lines 283–294):
        ```css
        283: body.solar-light-mode {
        284:   --partner-primary: #000000 !important;
        ...
        291:   background-color: #ffffff !important;
        ```
    *   The Ambient Light Sensor API triggers Solar Light Mode when ambient light exceeds 8,000 lux (lines 344–355).
*   **Offline Gateway specs**:
    *   The spec references WPA3-Personal captive portals and offline signature stroke capture (lines 106–107, 867–870):
        ```markdown
        867: *   The Optimization: Gate booths host a Secure P2P Local Gateway (e.g., "Gridpass-Gate-Local" secured via WPA3-Personal captive portal security with a pre-shared key printed on B2B ticket confirmations or gate banners, or enforced strict HTTPS-only local routes) hosting a local captive portal.
        ```

---

## 2. Logic Chain
1. **Schema Validation Crash**: Because `/api/resolve-tag` requires `isUnverifiedBypass` (camelCase, line 781) but the Firestore schema writes `is_unverified_bypass` (snake_case, line 619), any database record serialized directly to the API contract will fail schema validation. This casing mismatch causes API validation errors, crash/stranding users, or bypasses the Spectator Bypass Guard checks completely if parsing fails silently.
2. **Missing Tow Visual Match Fields**: The omission of `towVehicleType` and `towVehiclePlate` in `/api/resolve-tag` means the marshal scanner application cannot retrieve these fields for visual rig auditing, allowing unregistered tow vehicles to bypass security gate audits.
3. **Client geofencing bypass**: The route `/api/resolve-tag` allows client-supplied `lat` and `lng` query parameters (line 710) for radius calculations. A malicious user can remotely craft the GET request with Sonoma's coordinates (`&lat=38.1611&lng=-122.4546`) to spoof their location and scan any windshield tag, bypassing geofencing. Relying instead on IP-resolved location in rural dead zones yields high false-rejections because cellular IPs map to far-off cellular gateways.
4. **Physical-Layer Noon Glare Failure**: In direct noon sunlight ($100,000 \text{ lux}$), a display outputting $600 \text{ nits}$ after thermal throttling experiences a reflection glare of $1,432 \text{ nits}$ (using sRGB luminance formulas, line 27). This yields an effective contrast of $\mathbf{1.42:1}$ even in Solar Light Mode. This is mathematically unreadable, rendering the digital-only check-in terminal a single point of failure (SPOF) without physical paper backups.
5. **Captive Portal Canvas & DB Constraints**: Native Captive Network Assistant (CNA) browsers on iOS and Android do not persist state or support IndexedDB and drawing canvases (required for waiver signatures). Furthermore, forcing HTTPS locally prompts highly warning-laden SSL certificate error screens, causing users to drop out of the offline captive portal flow.

---

## 3. Caveats
- Since the terminal environment's command permissions timed out, we could not execute the Python verification script (`test_ux_and_crypto.py`) inside the active session. The findings are based on strict analytical review, manual static modeling of sRGB WCAG contrast equations, and Fitts's Law mathematical projections.
- We assume that the casing conversion is not handled by hidden custom middleware that has not been specified in `join_conversion_ui.md`.

---

## 4. Conclusion
We issue a final verdict of **BLOCKED** for Milestone 3 Gating Round 3.
The join conversion UI specification cannot be confirmed due to:
1. Critical casing mismatch (`is_unverified_bypass` vs `isUnverifiedBypass`) and missing fields in `/api/resolve-tag` JSON schemas.
2. High-risk location spoofing via client-side latitude/longitude parameters in `/api/resolve-tag`.
3. Total failure of contrast readability under direct sunlight due to physical reflection noise and thermal screen throttling.
4. Failure of offline local gateway captive portal canvas/DB functionality due to mobile OS security sandboxing.

---

## 5. Verification Method
1. **Schema Check**:
   - Inspect `join_conversion_ui.md` Section 5, comparing the `RegistrationDocument` interface (snake_case) with the `/api/resolve-tag` JSON schema `properties` and `required` list (camelCase).
   - Verify that `towVehicleType`, `towVehiclePlate`, and `trailerType` are missing from the `registrationContext` properties of `/api/resolve-tag` schema.
2. **HTTP Parameter Spoofing Check**:
   - Verify that the GET parameter list under Section 5 explicitly includes `lat` and `lng` as optional parameters.
3. **Contrast Mathematical Modeling**:
   - Run sRGB contrast math with `test_ux_and_crypto.py` formulas:
     ```python
     calculate_effective_contrast("#ffffff", "#000000", screen_nits=600, ambient_lux=100000, reflection_coeff=0.045)
     ```
     Confirm the output is ~1.42:1, which fails the WCAG readability gate.
