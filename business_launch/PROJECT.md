# Project: gridpass.app Business, Outreach & Growth Launch

## Architecture
- **Lead Acquisition & Search Automation**: Python utility that interacts with standard search APIs or parsing libraries to search for leads and output them into a structured CSV format.
- **Outreach & Digital Pitching**: A structured markdown playbook containing cold email, follow-up, and social media outreach scripts, along with a pitch deck layout.
- **UX Conversion Optimization**: A UX/UI architecture document detailing high-converting interfaces, friction-reduction techniques, and dynamic layout schemas for physical scan interactions.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Lead Database & Tool | Implement `find_leads.py` script and compile 50+ validated leads in `leads.csv` | None | DONE |
| 2 | Multi-Channel Outreach Playbook | Write outreach sequences and text-based pitch deck in `outreach_playbook.md` | None | DONE |
| 3 | Landing Experience UX Enhancement | Write UX architecture and mockup proposal in `join_conversion_ui.md` | None | DONE |
| 4 | Final Verification & Synthesis | Verify all assets, run automated integrity checks, and prepare final launch summary | M1, M2, M3 | DONE |

## Interface Contracts
- `leads.csv` must support the following column headers exactly:
  `Name, Category, Location, Website, Email, Phone, Instagram, Facebook`
- `find_leads.py` must support executing search via command-line arguments (e.g. state, city, zip code) and append new records to `leads.csv` avoiding duplicates.

## Code Layout
- `leads.csv` — Root-level lead database.
- `find_leads.py` — Root-level Python Lead Finder script.
- `outreach_playbook.md` — Root-level outreach playbook & text pitch deck.
- `join_conversion_ui.md` — Root-level UX optimization proposal document.
