# Quality Review Report — Landing Experience UX Optimization

**Verdict**: REQUEST_CHANGES (with major/minor findings to resolve variable mismatches and schema omissions)

---

## Review Summary
The UX optimization proposal in `join_conversion_ui.md` presents a highly strategic, well-designed mobile-first ingress architecture for the Gridpass ecosystem. The three responsive ASCII-art viewports (375px–412px widths) are laid out with precision, showing a clear appreciation for the constraints of outdoor, high-contrast, high-pressure environments.

However, during our independent technical review, we identified a critical visual property class mismatch in the CSS styling declarations, a database schema omission that risks breaking passenger waiver verification, and minor styling opportunities to ensure 100% compliance with mobile wallet brand guidelines.

---

## Findings

### [Major] Finding 1: CSS Variable Mismatch in Accent Classes
- **What**: The `.border-partner-accent` and `.text-partner-accent` CSS classes do not use the partner accent variables.
- **Where**: `join_conversion_ui.md` (Lines 211–223)
- **Why**: 
  The CSS overlay definitions are declared as follows:
  ```css
  .border-partner-accent {
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.2s ease-in-out;
  }
  .border-partner-accent:hover {
    border-color: var(--partner-primary);
    box-shadow: inset 0 0 12px hsl(var(--partner-primary-hsl) / 0.08);
  }
  .text-partner-accent {
    color: var(--partner-primary);
  }
  ```
  Note that on hover, `.border-partner-accent` overrides the border color with `var(--partner-primary)` instead of `var(--partner-accent)`. Similarly, `.text-partner-accent` binds to `var(--partner-primary)`. This variable mismatch collapses the primary and accent colors into a single color channel, breaking the custom HSL branding hierarchy and rendering `--partner-accent` and `--partner-accent-hsl` redundant.
- **Suggestion**: 
  Modify the classes to correctly utilize the accent tokens:
  ```css
  .border-partner-accent:hover {
    border-color: var(--partner-accent);
    box-shadow: inset 0 0 12px hsl(var(--partner-accent-hsl) / 0.08);
  }
  .text-partner-accent {
    color: var(--partner-accent);
  }
  ```

### [Major] Finding 2: Missing Passenger Waiver Support in Firestore Registration Schema
- **What**: The Firestore `RegistrationDocument` schema lacks a mechanism to associate passenger waivers with a vehicle/rig check-in.
- **Where**: `join_conversion_ui.md` (Lines 521–539, Section 5)
- **Why**: 
  Scenario B (Rausch Creek Offroad) displays: `"Riders: 2 Active (Waivers Verified)"`. However, the `RegistrationDocument` schema defines:
  ```typescript
  export interface RegistrationDocument {
    id: string;
    event_id: string;
    user_id: string;                    // Single foreign key mapping
    vehicle_id: string;                 // Single foreign key mapping
    ...
  }
  ```
  Because the schema only maps a single `user_id` and a single `vehicle_id` per registration, there is no structural capability to represent multiple passengers/riders within a single vehicle check-in. Under the current schema, a gate marshal scanning a single rig QR code would have no way to verify if the passenger's waiver has been signed unless the passenger is forced to undergo a separate check-in process, which contradicts the "One-Scan" multi-passenger entry claim.
- **Suggestion**: 
  Expand the `RegistrationDocument` interface to support passenger mappings, either via an array of passenger user IDs (`passenger_user_ids?: string[]`) or an array of associated registration IDs (`passenger_registration_ids?: string[]`), or design a separate `group_registrations` model.

### [Minor] Finding 3: Apple/Google Wallet Badge Visual Over-Encapsulation
- **What**: Apple and Google Wallet badges are encapsulated inside custom `.glass-card` borders in Scenario A.
- **Where**: `join_conversion_ui.md` (Lines 303–307)
- **Why**: 
  The mockup visually nests the wallet badges:
  ```
  |  +─────────────────────────────────────────────+  |
  |  | [ Add to Apple Wallet ]                     |  | <- Native Apple Wallet (H=48px)
  |  +─────────────────────────────────────────────+  |
  ```
  According to Apple's *Add to Apple Wallet Guidelines* and Google's *Google Wallet Brand Guidelines*, wallet badges must stand alone on transparent or high-contrast neutral backgrounds. Wrapping them inside custom container borders (`+───────+`) introduces visual noise and violates strict co-branding layout compliance rules.
- **Suggestion**: 
  Represent these badges as standalone elements without the enclosing borders in the layout mockups.

### [Minor] Finding 4: Absence of Programmatic Screen Brightness Maximize Option
- **What**: The mobile-first design has no stated plan to maximize screen brightness during gate barcode display.
- **Where**: `join_conversion_ui.md` (Section 6.2)
- **Why**: 
  Outdoor gate checks face extreme glare. While offline Wallet passes (`.pkpass`) automatically boost screen brightness to 100%, the browser fallback (State F/State G web views) does not explicitly suggest or handle screen brightness scaling.
- **Suggestion**: 
  Incorporate a technical note recommending the integration of the **Screen Wake Lock API** or a high-contrast "Maximize Brightness" button directly inside the web browser view.

---

## Verified Claims

- **Visual Co-Branding HSL Variable Schema**: Verified HSL syntax is valid CSS standard format -> **PASS**
- **Touch Targets (48px–54px)**: Verified heights conform to iOS Human Interface Guidelines (min 44px) and Android touch target guidelines (min 48px), optimized for gloved check-ins -> **PASS**
- **Single-Column Grid Layouts**: Verified layouts conform to 375px–412px limits with no horizontal scroll requirements -> **PASS**

---

## Coverage Gaps

- **JSON Schema Validation vs. HSL Output**: The JSON partner payload maps colors as HSL strings (e.g. `"358 79% 50%"`), but does not define validation regex patterns in the JSON Schema to enforce HSL formatting. 
  - *Risk Level*: Low.
  - *Recommendation*: Add a `"pattern": "^[0-9]{1,3}\\\\s+[0-9]{1,3}%\\\\s+[0-9]{1,3}%$"` pattern to the `api/resolve-tag` JSON schema.

---

## Unverified Items
- **Actual Twilio API / SMS Gateway Performance**: We cannot verify actual SMS latency in remote trail areas without hardware network telemetry -> *Reason*: Out of scope for architectural review.
