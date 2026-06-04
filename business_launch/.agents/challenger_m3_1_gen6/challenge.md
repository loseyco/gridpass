# Adversarial Review Gating Report (Milestone 3 - Round 6)

## Challenge Summary

**Overall risk assessment**: LOW

The Landing Experience UX Specification (`join_conversion_ui.md`) represents a highly secure, performant, and resilient system. The cryptographic envelope pattern (`SignedSecurePass`) completely eliminates serialization order drift and trial-verification DoS vectors. The passenger waiver entropy upgrade (64-bit raw binary SHA-256 hashes) neutralizes Birthday Paradox spoofing threats, and the spectator bypass guards successfully close the waiver evasion loopholes. 

However, under extreme paddock operational conditions and active adversarial exploitation, minor edge-case failure modes remain in the offline verification architecture.

---

## Challenges

### [Medium] Challenge 1: Multi-Scanner Split-Brain Replay Evasion
- **Assumption challenged**: Offline double-scan replay attacks can be fully prevented by the local scanner cache.
- **Attack scenario**: A venue deployment utilizes multiple ingress lanes (e.g., Gate 1 and Gate 2) operating in a cellular dead zone. A user screenshots their active driver pass and shares it with another driver. Driver A scans at Gate 1 while Driver B scans at Gate 2 simultaneously. Because the scanners are offline and cannot sync real-time databases via WAN, the split-brain state allows both vehicles to enter the paddock, evading registration checks.
- **Blast radius**: Multi-vehicle fee evasion and entry of unverified/un-inspected vehicles.
- **Mitigation**: Specify a local, sub-second peer-to-peer WPA3 mesh network sync loop between gate terminals to share the `ScanCacheRecord` local database buffer offline without relying on WAN.

### [Low] Challenge 2: Offline Terminal Clock-Drift Lockout / Bypass
- **Assumption challenged**: Terminal system clocks are accurate enough to enforce the strict 30-minute validity window for on-demand guest/spectator passes.
- **Attack scenario**: An offline gate terminal's battery drains or its hardware clock drifts by several hours. If the clock drifts forward, all valid, newly generated spectator passes are instantly flagged as expired (violating the <5s entry SLA). If the clock drifts backward, the 30-minute validity window effectively expands, allowing attackers to replay expired on-demand passes.
- **Blast radius**: Localized operational lockout (legitimate guests rejected) or pass replay vulnerability.
- **Mitigation**: Implement relative monotonic time tracking on scanning terminals, or cross-reference system times across marshals' devices via the local mesh network, flagging terminal clock drift alerts if a time mismatch is detected.

### [Low] Challenge 3: Lack of Offline Biometric Verification for Passengers
- **Assumption challenged**: Marshal visual inspection of the passenger legal names list in the decoded `SecurePassMetadata` prevents unauthorized entries.
- **Attack scenario**: A driver checks in with two legitimate passengers who signed waivers. If the driver brings two different individuals (who have not signed waivers) but they verbally claim the names displayed on the screen, the marshal might wave them through without conducting strict government ID checks under high-throughput entry pressure.
- **Blast radius**: Un-waived passenger injury, creating severe legal liability for the venue.
- **Mitigation**: Embed a compact, low-resolution grayscale thumbnail of the passenger's registered selfie directly in the `SignedSecurePass` payload (or local PWA cache) for instant offline visual verification on the marshal app.

---

## Stress Test Results

- **Trial Verification DoS Attack** → 100 invalid signatures scanned under key rotation → Legacy trial checks force $100 \times N$ Ed25519 signature checks (stranding scanner) → Remediated `signing_key_id` look-up rejects invalid key IDs instantly with 0 signature checks, and performs exactly 1 check for valid key IDs (passing SLA) → **PASS**
- **Waiver Collision Spoofing** → Attendant attempts to brute-force a duplicate passenger waiver hash → Legacy 32-bit truncated hex allows collision in $\approx 65,536$ variations (3 seconds on mobile) → Remediated 64-bit raw binary hash increases combinations to $2^{64}$, requiring billions of variations ($1,000+$ years on mobile) → **PASS**
- **Driver Spectator Bypass Ingress** → Driver attempts to check in as a spectator via bypass link → Legacy allows driver to check in without vehicle fields or waivers and enter lane → Remediated lane-isolation triggers persistent audio/visual alarms on vehicle lane terminals when spectator passes are scanned, blocking ingress → **PASS**
- **Fitts's Law Margin Spacing under High Vibration** → Glove-wearing marshal attempts to tap screen on bumpy gravel trail → Legacy lacks padding, causing adjacent mis-taps → Remediated 20px spacing placeholders and minimum 48px/54px heights achieve high touch accuracy → **PASS**

---

## Unchallenged Areas

- **Apple / Google Wallet Native Cryptographic Sandboxing** — Out of scope. We assume that native iOS/Android wallet pass rendering and local geofencing triggers operate as specified by their respective OS vendors.
