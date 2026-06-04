## 2026-05-22T15:29:17Z
You are Worker Gen 2 M2.
Your working directory is: c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m2_gen2.
Your parent is: e129e894-5d40-4306-964a-3f2a3e904a05 (the orchestrator).

Your task is to remediate several functional, geographic, and spelling issues in `outreach_playbook.md` and `leads.csv` based on validation findings:

1. Factual Geographic Corrections in Mappings:
   - In `outreach_playbook.md` (and inside the personalization script), update access road mapping for **Sonoma Raceway** from `"Highway 37 / Crows Landing Road"` to `"Highway 37 / Sears Point Road"`.
   - In `outreach_playbook.md` (and inside the personalization script), update access road mapping for **Lime Rock Park** from `"Highway 112 / Salmon Fell Road"` to `"Route 112 / Lime Rock Road"`.
   - In `outreach_playbook.md` (and inside the personalization script), update access road mapping for **Virginia International Raceway** from `"Birch Creek Road"` to `"Pine Tree Road"`.

2. Script Automation Gaps (Section 6.1):
   - Replace the truncated `...` (ellipses) inside the f-strings of Section 6.1 with the **full, complete email bodies** from Section 2.2 and Section 3.3.
   - Implement dynamic greeting fallback logic: if a contact's first name is missing in `leads.csv`, address them as `Hi {recipient_title},` (resolved as `Track Manager`, `Park Director`, or `Club President` depending on the category) instead of leaking `Hi [First Name],`.
   - Implement state name translations: convert 2-letter state abbreviations (e.g. `CA`, `TN`) dynamically to full state names (e.g. `California`, `Tennessee`) in the generated drafts to make the region phrasing natural (`"...solve this gate bottleneck for venues in the California region..."` instead of `"venues in the CA region"`).
   - Ensure the script safe-parses empty rows and trailing empty lines.

3. Typos and Spelling Mismatches:
   - In the Section 5 (Slide 8) Pricing Table: Change `PARTNER & CONSUMER TIRES` to `PARTNER & CONSUMER TIERS`.
   - Table of Contents anchor for Section 6: Correct the broken Markdown link anchor `(#6-playbook-operations-&-campaign-management)` to `(#6-playbook-operations--campaign-management)` (remove ampersand from anchor).

4. Cadence & Sequence Alignments:
   - In Section 2.3 (Track Social DM), append Message 3 to fully complete the 3-step disarming cadence:
     `**Message 3: The Bridge to Booking / Pilot Offer**`
     `> "Hey [Track Name] team, just following up. I’d love to coordinate a super-brief, 5-minute pilot demo for [Track Name]'s gate layout to show how easily we eliminate paper liability bottlenecks. Is there a good email or phone number for the operations team that I could reach directly?"`
   - Spacing: Realign Car Club DM cadence timeline to consistent values between Section 3.1 and Section 4.2.
   - Ensure follow-up scripts in Section 2.3 and Section 4.1 are harmonized and aligned.

5. Database Correction (`leads.csv`):
   - Locate **Rausch Creek Off-Road Park** (Line 23). Update its website from `https://www.rcotv.com` to `http://www.rc4x4.org/`, and update its email to `info@rc4x4.org`.

Acceptance Criteria:
- Implement all playbook and database corrections cleanly.
- Run a local validation pass of the personalization script to confirm it executes without syntax/runtime errors and successfully drafts 52 geographically and linguistically accurate emails.
- Write your handoff.md and update progress.md in your folder.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
