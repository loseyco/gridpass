## 2026-05-22T15:51:38Z
You are the Milestone 3 UX Remediator (Gen 4).
Your working directory is: c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m3_gen4

Your task:
Fully remediate the landing experience specification document `c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md` based on the comprehensive findings and action items detailed in the synthesis report at `c:\_Projects\Gridpass-v4\business_launch\.agents\orchestrator\milestone3_remediation_synthesis.md`.

You must make the following specific edits to the `join_conversion_ui.md` file:
1. Section 2: B2C Towing Onboarding Journey Map
   - Integrate "Spectator Bypass Guards" to prevent active drivers/rigs from circumventing legal waivers. Add strict lane isolation rules, require manual ID checks for bypassed guest passes, and specify an orange layout for bypassed unverified sessions.
   - Prevent vibration mis-taps: change the vertical spacing/margins between stacked touch targets in Scenario A to a minimum of 20px.
   - Resolve waiver custody: replace browser localStorage with localized database caching (Gridpass-Gate-Local captive portal DB) or indexedDB secure persistence in the edge-case table.
   - Enforce windshield decal security geofencing checks or member-verification requirements.
2. Section 3: Visual Co-Branding Variable Model & CSS Overlay
   - Implement Solar Light Mode CSS overrides to force absolute pure black (#000000) and white (#ffffff) styling regardless of brand HSL variables.
   - Add progressive enhancement fallbacks for the Ambient Light Sensor API to prevent sensor shade SPOF lockouts.
3. Section 4: Mobile-First Viewport Mockups
   - Redraw the Scenario A mobile-first ASCII-art layout to place the QR Scan Barcode and Clearance Status "above the fold" (at the top of the viewport) to ensure under 5-second scanner ingress.
   - Scale all Scenario A buttons to 54px heights and separate them with a minimum of 20px margins.
4. Section 5: Database Schemas & API Resolvers
   - Correct the `category` property of `VehicleDocument` to use logical vehicle asset classes: `'car' | 'truck' | 'suv' | 'motorcycle' | 'utv' | 'other'`.
   - Correct `type` in `RegistrationDocument` from `'event'` to `'registration'`.
   - Correct `vehicle_id` in `RegistrationDocument` to be optional (`string | null`) to support spectator bypass check-ins.
   - Add `trailer_plate: string | null` to `RegistrationDocument` to capture rear tow-rig plates.
   - Close the unclosed markdown code block at line 537 (` ``` `) for `waiver_signatures`.
   - Update the `/api/resolve-tag` API JSON contract schema to include the `"no_show"` checkInStatus option, remove the non-existent `isPremium` field from `vehicleContext`, and match all schema corrections.
5. Section 6: Persuasive Conversion Mechanisms
   - Detail the Protobuf-based binary metadata compression schema to reduce QR code density to Version 11.
   - Detail offline double-scan replay prevention via a marshal scanning app counter cache.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your complete worker report and handoff details in your folder, and send a completion message back to the orchestrator (conversation ID: 400f9ac1-a525-4aa7-8457-99fc737be6e0) once the remediation is successfully written and verified.
