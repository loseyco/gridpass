## 2026-05-22T15:44:19Z

You are Worker Gen 2 M3.
Your working directory is: c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m3_gen2.
Your parent is: e129e894-5d40-4306-964a-3f2a3e904a05 (the orchestrator).

Your task is to remediate the visual, technical, legal, and cryptographic gaps identified in the Milestone 3 UX optimization proposal document `c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md`.

You must carefully read:
1. The master proposal at: `c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md`
2. The gating remediation synthesis report at: `c:\_Projects\Gridpass-v4\business_launch\.agents\orchestrator\milestone3_remediation_synthesis.md`
3. The Reviewers' handoff reports at:
   - `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_reviewer_m3_1\handoff.md`
   - `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_reviewer_m3_2\handoff.md`
4. The Forensic Auditor's handoff report at:
   - `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_auditor_m3\handoff.md`

Your specific implementation items in `join_conversion_ui.md` are:
1. **CSS Accent Variable Alignment**: Correct `.border-partner-accent:hover` and `.text-partner-accent` to reference `var(--partner-accent)` and `hsl(var(--partner-accent-hsl) / 0.08)` instead of hardcoded primary variables.
2. **Legal Waiver Signature Paths (ESIGN Compliance)**: Add `signature_strokes: string;` and `signature_image_url: string | null;` to the `WaiverSignatureDocument` schema. Document that full stroke coordinate paths and images are saved to ensure 100% legal compliance with ESIGN and state laws.
3. **Dynamic Asymmetric Cryptographic Offline Token**: Replace `cryptographic_token: string;` with `cryptographic_signature: string;` in `RegistrationDocument`. Document that the server's private key generates an asymmetric Ed25519 signature of driver metadata, and the offline scanner verifies it using a pre-loaded public key.
4. **Rig & Tow Data Integrity**: Add `tow_vehicle_type`, `trailer_type`, and `tow_vehicle_plate` to `RegistrationDocument` to store declared rig values and prevent data loss.
5. **Missing Database Schemas**: Add full, comprehensive TypeScript interface definitions for `UserDocument`, `VehicleDocument`, and `WaiverTemplateDocument`.
6. **Firestore Query Best Practices**: Update `geo` in `VenueDocument` to use native Firestore `GeoPoint`. Update date and time parameters in `EventDocument` to use Firestore `Timestamp` objects instead of raw strings.
7. **Schema & Resolver Enum Alignment**: Exactly align all `status` enums to `'active' | 'unclaimed' | 'suspended'` and `type` enums to `'vehicle' | 'user' | 'venue_gate' | 'event' | 'unclaimed'` in both `TagRegistryDocument` and the `/api/resolve-tag` JSON Schema.
8. **App Store Brand Guidelines Compliance**: Clean up the Scenario A layout ASCII mockup by removing the enclosing card borders (`+────+`) surrounding Apple and Google Wallet badge elements.
9. **High-glare Sunlight, Glove, and Privacy Optimizations**: In Section 2 and 6, document specifications for:
   - **Solar Light Mode Toggle**: High-density white theme fallback.
   - **Zero-Touch Auto-Ingress**: NFC/Bluetooth Beacon proximity triggers.
   - **Windshield Privacy Filter**: Strict visibility toggle on user profiles, making dynamic paddock rosters anonymous by default.
   - **Pre-Arrival Caching & Queue Mitigation**: Mandate pre-arrival wallet pass downloads to bypass server-side CPU signing bottlenecks.
   - **Spectator Bypass Guard**: Tie bypass check-ins to strict user-type checks to prevent waiver evasion.

Maintain your progress.md at `c:\_Projects\Gridpass-v4\business_launch\teamwork_preview_worker_m3_gen2\progress.md` (Wait, let's keep it in the working directory `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m3_gen2\progress.md`) and write a detailed handoff.md in your folder when complete. Notify the orchestrator as soon as the modifications are successfully saved to `join_conversion_ui.md`.
