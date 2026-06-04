# ADVERSARIAL STRESS-TEST REVIEW: GRIDPASS LANDING EXPERIENCE SPECIFICATION

## Challenge Summary

**Overall Risk Assessment**: **CRITICAL**

While the newly remediated landing experience specification document (`join_conversion_ui.md`) presents a highly sophisticated, high-performance physical-to-digital ingress architecture, it contains several critical logical, network-architectural, browser-sandbox, and physical-layer vulnerabilities. Under high-throughput conditions (Saturday morning gate backups) and adversarial environments, these vulnerabilities could be exploited to bypass liability waivers, enable gate fee evasion via screenshot replay attacks, disable local network synchronization, or completely lock out valid drivers.

The current specification has a **BLOCKED** verdict pending the remediation of the critical loopholes outlined below.

---

## Challenges

### [Critical] Challenge 1: The 4-Hour vs. 30-Minute Validity Window Conflict & Operational Queue Lockout
*   **Assumption Challenged**: That shrinking the temporal gate validity window to 30 minutes prevents screenshot sharing without locking out valid drivers.
*   **Attack / Failure Scenario**: 
    1.  **Queue Backup Latency**: On peak mornings, the queue of heavy vehicle rigs backing up onto public roads can easily exceed 60–90 minutes. A driver who generates their pass 24 hours prior (mandated for pre-arrival CDN caching) or registers just before joining the queue will have their 30-minute validity window expire *while they are waiting in the vehicle lane*.
    2.  **No Cell Coverage Refresh Lockout**: When the driver reaches the front gate, their pass is flagged as stale (>30 minutes post-generation) and rejected. Because they are in a cellular dead zone, they cannot connect to the WAN to refresh their pass or generate a new one. The marshal is forced to either manually override the lockout (inducing severe delay) or turn the vehicle away.
    3.  **Screenshot Replay Loophole**: If the window is reverted to 4 hours to prevent lockout, it re-opens a massive screenshot duplication loop. Because native Apple/Google Wallet passes (`.pkpass` files) **cannot execute JavaScript or dynamically rotate their QR codes offline**, their QR payload is completely static. An attendee can easily screenshot their pass and text it to multiple other drivers, who can scan in using the same credentials.
*   **Blast Radius**: Severe gate-lane backups, complete operational breakdown, high-rate waiver evasion, and gate-fee losses.
*   **Mitigation**:
    - **Dynamic PWA Queue Refresh**: Do not use a static 30-minute expiration for passes. Instead, the PWA client-side Service Worker should generate a rolling offline HMAC token (TOTP-style) derived from a shared secret and the user's `registration_id`.
    - **Local Gateway Validation**: Marshal terminals must validate these rolling TOTPs against their local synchronized system clock, ensuring that screenshots older than 60 seconds are rejected, while valid passes remain functional regardless of queue wait times.

---

### [High] Challenge 2: The 30-Second Mesh Network Sync Loss Split-Brain Vulnerability & Wi-Fi Jamming Exploitation
*   **Assumption Challenged**: That a WPA3 Wi-Fi mesh network will maintain constant synchronization, and that a 30-second sync loss threshold is sufficient for entering Isolated Mode.
*   **Attack / Failure Scenario**:
    1.  **Signal Obstruction**: Physical gate environments are full of large metal obstructions (tow rigs, trailers, RVs, campers) that attenuate and block 2.4GHz/5GHz Wi-Fi signals.
    2.  **Alarm Fatigue**: A 30-second synchronization loss threshold is too short. Scandals, brief interference, or a passing rig will cause terminal scanners to constantly drop and re-enter Isolated Mode. The resulting loud audible alarms, haptic vibrations, and full-screen blocking prompts will trigger severe **alarm fatigue** for marshals. Under pressure to clear a 100-vehicle backup, the marshal will quickly disable the alarm, ignore the warnings, or tap through the prompt without checking.
    3.  **Wi-Fi Deauth/Jamming Exploit**: An adversary can use a cheap, pocket-sized Wi-Fi deauther or RF jammer to jam the `Gridpass-Gate-Local` mesh network. This forces all marshal terminals into "Isolated Mode" simultaneously. In Isolated Mode, the SQLite/IndexedDB counter caches are split. The adversary can now present a single verified pass screenshot to multiple marshals across different lanes. Since the terminals cannot sync their counter caches in real time, the double-scan will not be detected, enabling unlimited free entry.
*   **Blast Radius**: 100% defeat of the offline double-scan replay prevention system.
*   **Mitigation**:
    - Increase the mesh sync loss threshold to **3 minutes** before triggering Isolated Mode.
    - Implement a silent, non-intrusive warning banner for mesh dropouts, reserving loud alarms strictly for confirmed duplicate scans.
    - In Isolated Mode, the terminal must require a physical confirmation tap of the matching license plate (read from the tow vehicle/trailer) before allowing manual override, ensuring visual checks are actively enforced rather than skipped.

---

### [Critical] Challenge 3: PWA Offline Architecture & Local Sync Technical Fallacies
*   **Assumption Challenged**: That client devices can reliably pre-cache assets, store signatures in IndexedDB, and synchronize via Bluetooth/NFC or secure local wildcard HTTPS without browser errors or warnings.
*   **Attack / Failure Scenario**:
    1.  **Private/Incognito Browsing Lockout**: If a driver scans the QR code and their browser is set to Private/Incognito Mode, iOS Safari and Android Chrome heavily restrict or disable IndexedDB access. Offline signatures will fail to write to storage, completely blocking the waiver signature process. If they do write, Safari wipes Private Browsing storage as soon as the tab is closed, causing completed offline signatures to be lost before they can be synchronized.
    2.  **Web Bluetooth & Web NFC Sandbox Restrictions**: The specification claims the offline client PWA can sync signatures via Web Bluetooth or Web NFC. However, **modern mobile browsers strictly prohibit Web Bluetooth and Web NFC from running in the background (Service Workers or background sync tasks)**. They require active, foreground user interaction and permission prompts for security. Background peer-to-peer sync from a closed phone or a backgrounded PWA tab is a **technical impossibility** under current iOS/Android browser sandboxes.
    3.  **DNS-to-IP Offline Resolution Failure (DoH Block)**: Connecting to the local gateway (e.g. `http://*.local.gridpass.app` ➔ `192.168.1.50`) relies on the local network DNS resolver. However, modern browsers and operating systems increasingly enforce **DNS-over-HTTPS (DoH)** (e.g. querying Google or Cloudflare secure DNS servers directly). In a dead-zone gate, there is no WAN connection. The DoH queries will fail to resolve the domain, bypassing the local router's DNS hijack and rendering the local gateway completely unreachable.
    4.  **Wildcard SSL Private Key Exposure**: To establish HTTPS on the offline gate gateways, each physical gateway must hold the private key and SSL certificate for `*.local.gridpass.app`. Since these gateways are distributed physical boxes at remote tracks, any stolen or compromised gateway terminal would expose the wildcard SSL private key. Attackers could then execute high-value Man-in-the-Middle (MitM) attacks against all Gridpass traffic.
*   **Blast Radius**: Total failure of the offline onboarding flow, browser-level security blockouts, lost legal waiver signatures, and severe cryptographic key compromises.
*   **Mitigation**:
    - **Bypass Private Browsing**: The web app must detect Private/Incognito mode and display a high-visibility modal instructing the user to switch to a standard browsing tab to complete the offline waiver.
    - **Abandon Web Bluetooth/NFC for Background Sync**: Rely strictly on standard local WPA3 Wi-Fi network endpoints (`http://192.168.1.1/api/sync-signature`) accessed via active foreground browser fetch loops while the user has the pass open.
    - **Remove Wildcard DNS-to-IP**: Use standard, secure local HTTP routing inside password-protected, encrypted local WPA3-Personal Wi-Fi networks for offline syncing, or utilize localized gateway-specific self-signed certificates with a simple manual trust prompt, keeping wildcard private keys secure on cloud servers.

---

### [High] Challenge 4: Solar Light Mode CSS Scoping & SVG Image Clashing Loophole
*   **Assumption Challenged**: That the main document's CSS overrides (`body.solar-light-mode svg`) can style all vector SVGs and brand logos to prevent clashing under harsh glare.
*   **Attack / Failure Scenario**:
    1.  **CSS Scoping/Boundary Bypass**: The specification defines CSS overrides to force all SVGs to fill/stroke black. However, if a partner's logo SVG is rendered using a standard `<img>` tag (e.g. `<img class="brand-logo" src="/logos/sonoma_white.svg" />`), **browser security models strictly sandbox the image, preventing document-level CSS rules from styling its internal paths**. The white SVG logo will remain completely white, rendering it 100% invisible against the pure white (`#ffffff`) background of Solar Light Mode.
    2.  **Clearance indicator Neutralization**: Solar Light Mode CSS overrides force all glass cards to a solid white background and flat black border:
        ```css
        body.solar-light-mode .glass-card {
          background: #ffffff !important;
          border: 2px solid #000000 !important;
          box-shadow: none !important;
        }
        ```
        This completely overrides and neutralizes the `.status-clear-glow` class, which animates `border-color` and `box-shadow` to pulse emerald green. In high-glare environments, the marshal will lose the high-visibility "green pulse" that signifies clearance, forcing them to squint and read the micro-copy text to verify check-in status.
*   **Blast Radius**: Severe B2B logo color clashing, degraded brand trust, and operational gate delays due to lost visual clearance cues.
*   **Mitigation**:
    - **Inlined SVGs**: Mandate that all vector B2B logos and SVGs be explicitly inlined into the HTML DOM (using a library like `react-inlinesvg` or direct React custom components) rather than loaded via `<img>` tags, allowing the CSS `stroke` and `fill` rules to target their paths.
    - **Preserve Color Cues in Solar Mode**: Modify the Solar Light Mode CSS rules to allow high-contrast solid borders for clear status. For example:
        ```css
        body.solar-light-mode .status-clear-glow {
          border: 4px solid #10b981 !important; /* Thick solid Emerald green border in solar mode */
          box-shadow: none !important;
        }
        ```

---

## Stress Test Results

| Scenario Tested | Expected Behavior | Actual/Predicted Behavior | Pass/Fail |
|---|---|---|---|
| **90-Minute Queue Wait in Dead Zone** | Pass remains valid; driver scans and clears gate instantly. | Pass expires at 30-minute mark; cell signal is dead; driver locked out. | **FAIL** (Challenge 1) |
| **Screenshot Sharing across Lanes** | Offline counter cache flags duplicate scan; marshal stops vehicle. | Mesh drops due to RV blockage (>30s); terminals enter Isolated Mode; split-brain allows duplicates to pass unchecked. | **FAIL** (Challenge 2) |
| **Offline Waiver in Safari Private Tab** | Signed waiver saved in IndexedDB; synchronized via Bluetooth. | IndexedDB fails to write; Web Bluetooth background sync fails to execute. Signature lost. | **FAIL** (Challenge 3) |
| **Offline HTTPS Connection to Gateway** | SSL connection established without warnings using wildcard DNS. | DoH is active; local gateway fails to resolve offline. SSL warnings trigger. | **FAIL** (Challenge 3) |
| **White SVG Logo in Solar Light Mode** | Logo paths styled black; remains highly visible. | SVG loaded via `<img>` tag; CSS styles blocked by sandbox; logo invisible. | **FAIL** (Challenge 4) |
| **Clearance Screen in Solar Light Mode** | Marshal identifies clearance from 10 feet via emerald pulse. | Pulse styling neutralized by `!important` solar overrides. Marshal must read text. | **FAIL** (Challenge 4) |

---

## Unchallenged Areas

- **Stripe Connect & Split-Billing (`financial_split_billing.md`)**: Checked out of scope for this visual and network ingress stress-test review.
- **Paddock Leaderboard Peer-Voting**: Out of scope for physical gate clearance and safety compliance.
