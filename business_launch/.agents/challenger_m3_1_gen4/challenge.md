# Adversarial Challenge Report — Gridpass v4 Landing Experience

This document compiles the adversarial stress-test review of the newly remediated landing experience specification document `join_conversion_ui.md`.

## Challenge Summary

**Overall risk assessment**: **CRITICAL** (due to a direct architectural collision that would brick pre-registered offline entry, and a 32-bit hash truncation collision loophole that permits bypass of legal waivers).

While the transition to a binary Protobuf format and the outer cryptographic envelope pattern represent major improvements in data density and serialization drift prevention, there are several critical vulnerabilities and architectural flaws that must be addressed before commercial launch.

---

## Challenges

### [Critical] Challenge 1: Pre-Arrival Caching vs. Shrunk Gate Validity Window (Operational Lockout)

- **Assumption challenged**: The 30-minute post-generation gate validity window is a secure and viable mechanism to prevent screenshot sharing for all passes.
- **Attack scenario**: 
  - The specification mandates that all Apple/Google Wallet `.pkpass` bundles be pre-generated, cryptographically signed, and cached 24 hours prior to the event start to bypass dynamic server-side signing CPU bottlenecks (State F/G).
  - Simultaneously, Section 7 enforces that the temporal gate validity window is shrunk to 30 minutes post-generation, and that stale screenshots outside this window are rejected instantly by the offline marshal scanner.
  - *Resulting Failure*: Every single pre-registered driver presenting their pre-downloaded pass (which was generated and signed 24 hours prior) will have a timestamp that is 24 hours old. The offline scanner will read this timestamp and immediately reject the pass as stale/expired.
- **Blast Radius**: **CRITICAL**. This completely bricks offline gate clearance for 100% of pre-registered drivers. It forces gate attendants to perform manual overrides or redirects for every vehicle, completely defeating the <5-second entry SLA and causing severe paddock traffic backups.
- **Mitigation**: 
  1. **Dual-Pass Lifecycle Differentiation**: Eliminate the 30-minute validity window for pre-arrival passes. Instead, validate pre-arrival passes for the **entire active duration of the event** (e.g., 24 hours).
  2. **Alternative Screenshot Protection**: Rely strictly on the **double-scan replay cache** (SQLite/IndexedDB buffer) to prevent duplicated passes, and the **Screenshot Evasion Guards** (visual verification of the driver's legal name, tow vehicle license plate, and passenger names decrypted from the secure pass metadata and displayed on the marshal scanner) to verify the physical vehicle and identity match the pass.
  3. **Targeted Validity Window**: Restrict the 30-minute validity window exclusively to on-demand, guest/spectator passes generated at the gate via SMS/PWA offline sync.

---

### [High] Challenge 2: 32-Bit Truncated Hex-String Passenger Waiver Collision (Legal Waiver Bypass)

- **Assumption challenged**: Storing the first 8 characters of a hex-encoded SHA256 waiver hash is sufficient to prevent active drivers/passengers from circumventing legal waivers.
- **Attack scenario**: 
  - An 8-character hex string represents only 4 bytes (32 bits) of actual hash data. A 32-bit hash space has an extremely low collision threshold ($2^{16} = 65,536$ trials under the birthday paradox).
  - An active driver or passenger ("Bob Smith") who has NOT signed the mandatory legal waiver (or who is banned) wants to circumvent the waiver check.
  - Bob creates a profile and generates a guest registration. Because the scanner is offline, it can only verify waivers by comparing Bob's waiver hash prefix against the pre-loaded local database of signed waivers, or checking if the hash exists.
  - Bob can easily brute-force different passenger name variants (e.g., "Bob Smith ", "Bob Smith  ", or "Bob_Smith") on his registration input. Within a fraction of a millisecond on a smartphone, he will find a name variant whose SHA256 waiver hash prefix matches the 8-character hex prefix of a completely different person (e.g., "Alice Jones") who *has* signed a valid waiver.
  - The offline scanner hashes Bob's registration name, gets the prefix, checks the database, finds Alice's valid signature under that same prefix, and clears Bob. Bob enters the paddock/track without ever signing a legal waiver.
- **Protobuf Inefficiency**: Storing 8 hex characters as a `string` in Protobuf takes 8 bytes of space. Storing a hex representation is 2x less dense than the binary equivalent.
- **Blast Radius**: **HIGH**. Legally invalidates waiver compliance, exposes the track to massive liability, and allows unauthorized/unverified participants to bypass safety gates.
- **Mitigation**: 
  1. Change the field type in `SecurePassMetadata` from `repeated string passenger_waiver_hashes = 10;` to `repeated bytes passenger_waiver_hashes = 10;`.
  2. Store **8 bytes of raw binary** (64 bits of entropy).
  3. *Size & Security Benefit*: Storing 8 bytes of raw binary takes the *exact same* 8 bytes of serialization overhead in Protobuf as an 8-character ASCII string! However, it increases the entropy from 32 bits to 64 bits. A 64-bit collision space raises the birthday collision threshold to $2^{32} \approx 4.29$ billion trials, making offline brute-force collision attacks practically impossible.

---

### [Medium] Challenge 3: Missing Outer Key Identifier & Trial Verification DoS

- **Assumption challenged**: The offline scanner can seamlessly verify Ed25519 signatures across multiple venues, events, and key rotations without performance degradation.
- **Attack scenario**: 
  - The `SignedSecurePass` envelope only contains `serialized_metadata` and `ed25519_signature`. It does not contain any key version, venue identifier, or public key fingerprint.
  - If Gridpass operates across multiple venues (each with different active signing keys) or executes standard key rotations, the scanner must support multiple active public keys.
  - When scanning a pass, the offline terminal has no idea which public key signed the pass. It is forced to perform "trial verification" (trying every pre-loaded key in its store).
  - An attacker can exploit this by submitting a custom QR pass with a randomized signature. The scanner will attempt Ed25519 signature verification against all pre-loaded public keys. Because Ed25519 verification is CPU-intensive, a flood of such scans will freeze the marshal's terminal, violating the <5-second entry SLA.
  - *Worse Developer Anti-Pattern*: To avoid trial verification, a developer might be tempted to deserialize `serialized_metadata` *first* to read the `venue_id` or `event_id` and determine the key. This completely violates the "verify before parsing" security rule, exposing the Protobuf parser to unverified, malicious binary payloads that could trigger memory corruption or DoS crashes.
- **Blast Radius**: **MEDIUM**. Blocks key rotations, degrades scanning throughput, and introduces CPU DoS risk.
- **Mitigation**: Add a `signing_key_id` or `key_fingerprint` to the **outer** `SignedSecurePass` envelope:
  ```protobuf
  message SignedSecurePass {
    bytes serialized_metadata = 1; // Immutable raw bytes of SecurePassMetadata
    bytes ed25519_signature   = 2; // Ed25519 signature over serialized_metadata
    uint32 signing_key_id     = 3; // Identifies the correct public key immediately
  }
  ```
  This allows the scanner to immediately select the correct pre-loaded public key from its database *without* parsing the untrusted `serialized_metadata` first.

---

### [Low] Challenge 4: Cryptographic Terminology Contradiction

- **Assumption challenged**: Ed25519 signature verification is correctly documented, avoiding developer implementation drift.
- **Observation**: Section 2 (State G) states: *"Gate scanner validates the asymmetric `cryptographic_signature` offline using a pre-loaded public key to **decrypt and verify** the driver metadata"*.
- **Attack scenario**: Ed25519 is an asymmetric signature scheme (EdDSA) and does not support decryption. The signature is verified over the plain binary `serialized_metadata` bytes; the metadata is not encrypted.
- **Blast Radius**: **LOW** (but can lead to developer confusion, implementation delays, or insecure custom encryption schemes being designed).
- **Mitigation**: Correct the terminology from "decrypt and verify" to "decode the outer envelope and verify the Ed25519 signature over the raw serialized metadata bytes."

---

## Stress Test Results

| Ingress Scenario | Expected Behavior | Predicted Behavior | Status |
|---|---|---|---|
| **Pre-Registered Driver (24h Pre-Download)** | Fast-pass scan resolves in <0.5s; driver cleared. | Scanner rejects pass as expired because the timestamp is 24 hours old (>30-min window). | **FAIL (CRITICAL BLOCK)** |
| **Banned Spectator (Truncated Hash Brute-Force)** | Banned user blocked at gate because they have no signed waiver. | Banned user brute-forces their name variant, matches a valid waiver prefix, and enters. | **FAIL (HIGH LEAK)** |
| **Attacker Submits Malformed QR Code (Multi-Key Event)** | Scanner instantly rejects signature without parsing or lag. | Scanner performs trial verification over multiple keys, causing CPU spike & queue lag. | **FAIL (MEDIUM RISK)** |
| **Glove-Wearing Driver (Solar Glare)** | Switch to high-contrast Solar Light Mode; button spacing prevents mis-taps. | UI contrast overrides work successfully; 20px spacing prevents mis-taps. | **PASS** |
| **Offline Signature Sync in CNA Viewport** | Offline signatures saved securely in local frame. | CNA browser lacks IndexedDB/Canvas support; fails to sync. (Handled by PWA caching). | **PASS (Mitigated)** |

---

## Unchallenged Areas

- **Stripe Connect Split-Billing**: Not reviewed in detail, as it is locked-in under the financial specification in `financial_split_billing.md` and falls outside the cryptographic/ingress boundary.
- **Windshield Privacy Filter (Anonymity)**: Checked for schema alignment, but out of scope for adversarial bypass stress-tests as it represents a static display policy.
