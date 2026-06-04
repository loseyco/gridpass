## 2026-05-22T16:23:19Z

Your task is to fully remediate the landing experience specification document `c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md` based on the comprehensive findings and action items detailed in the synthesis report `c:\_Projects\Gridpass-v4\business_launch\.agents\orchestrator\milestone3_remediation_synthesis_r6.md`.

You MUST perform this task by editing `join_conversion_ui.md` directly. DO NOT write code files or test files in the project directory — you are only editing `join_conversion_ui.md` to resolve the specified gaps in the specification.

### MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### Your Working Directory:
Your assigned working directory for coordination metadata is: `c:\_Projects\Gridpass-v4\business_launch\.agents\worker_m3_r6`. Please write your progress.md and handoff.md in this directory.

### Detailed Actions:
You must implement the following 4 remediations in `join_conversion_ui.md`:

1. **Gap 1: Wildcard DNS-to-IP Private Key Exposure at the Gate**
   - Locate and modify the section under State E ("Liability Waiver Signature & Dual-Integration Architecture" -> "Remove Wildcard DNS-to-IP Key Exposure") and State G or elsewhere referencing wildcard SSL/TLS certificates and physical paddock gate terminals/routers.
   - Explicitly forbid storing a publicly trusted wildcard private key directly on physical paddock gate terminals or localized gate routers.
   - Specify that the local offline gateway architecture must utilize either:
     1. Localized, gateway-specific self-signed certificates with a simple manual trust prompt on the driver's native browser, or
     2. Secure, un-encrypted local HTTP routing restricted strictly inside password-protected, encrypted local WPA3-Personal Wi-Fi paddock networks.
   - State that wildcard private keys must remain securely locked in cloud HSM/KMS environments.

2. **Gap 2: JSON Schema Mismatch & Runtime Validation Crash**
   - Locate Section 5 ("Unified JSON Schema" for `/api/resolve-tag`).
   - In the `registrationContext` schema definition properties, look at the `"required"` properties array.
   - Remove `"towVehicleType"`, `"towVehiclePlate"`, `"trailerType"`, and `"techStatus"` from the `"required"` properties array under `registrationContext` in the `/api/resolve-tag` JSON schema. This ensures spectator check-ins (which completely omit vehicle and technical inspection fields) do not trigger runtime validation crashes or violate the <5-second entry SLA.

3. **Gap 3: Missing Fields in TypeScript Database Interfaces**
   - Under Section 5, locate the `RegistrationDocument` interface (captures registration profiles).
   - Add `external_waiver_token?: string | null;` and `external_waiver_status?: string | null;` to the `RegistrationDocument` TypeScript interface under Section 5.

4. **Gap 4: Protobuf/Conceptual Schema Inconsistency & Visual Spacing**
   - **Protobuf/Conceptual Schema**: Under State C and State G (or anywhere else in the text), find references claiming that `techStatus` is set to null or completely excluded from the binary `SecurePassMetadata` Protobuf payload. Correct these texts to state that the vehicle technical/inspection status is managed solely through the driver's registration profile in Firestore and is not serialized into the compact binary pass payload (except where run groups implicitly segregate classes).
   - **Visual Spacing**: In Section 4, under the Scenario B ("Offroad & Adventure Parks") ASCII art mockup, locate where spacing margins are described. Ensure that you add `[20px Spacing]` or similar margin indicators to the Scenario B ASCII art mockup, similar to Scenario A.

### Handoff Requirements:
Once you have made these changes:
- Verify that `join_conversion_ui.md` is valid markdown, and all code blocks are properly balanced and complete.
- Verify that the modifications correctly address all 4 gaps.
- Write a detailed `handoff.md` in your working directory (`c:\_Projects\Gridpass-v4\business_launch\.agents\worker_m3_r6`) and report the completion.
