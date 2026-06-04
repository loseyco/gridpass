## 2026-05-22T14:53:14Z
You are a Versatile worker with loadable domain expertise. Your working directory is c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m1.
Your mission is to implement Milestone 1: Target Venue & Car Club Lead Database and Programmatic Search Tool.

Please read the design proposals, de-duplication rules, and compiled databases in:
- c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_explorer_m1_2\analysis.md
- c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_explorer_m1_3\analysis.md

Tasks to execute:
1. Create `c:\_Projects\Gridpass-v4\business_launch\leads.csv`. Initialize it with the header `Name,Category,Location,Website,Email,Phone,Instagram,Facebook` and pre-populate it with the 52 validated real-world leads provided in the Explorer analyses. Ensure that formatting is correct, strings with commas (like locations "Austin, TX") are properly double-quoted, and fields are exactly matched.
2. Implement a complete, fully functional Python script `c:\_Projects\Gridpass-v4\business_launch\find_leads.py` which:
   - Provides a command-line interface with `--state`, `--city`, `--zip`, `--category`, `--limit`, `--output` arguments.
   - Implements a repeatable, robust search pipeline querying OpenStreetMap's Overpass API, DuckDuckGo HTML search parsing, and/or Google Custom Search JSON API as a fallback.
   - Crawls target search result web pages to extract public email addresses, phone numbers, and Instagram/Facebook social media profiles using robust regex patterns.
   - Applies strict de-duplication rules: checks existing entries in `leads.csv` by normalizing and matching `Website` URLs and `Name|Location` combinations.
   - Appends new leads directly into `leads.csv` preserving the formatting.
   - Includes standard scraping compliance protocols (spoofed User-Agent rotation, request delays between 2.0 and 5.0 seconds, connection sessions, and robust try-except error handling).

MANDATORY INTEGRITY WARNING — include this verbatim in the Worker's dispatch prompt:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

Run a python syntax check and a test run of the scraper (e.g. `python find_leads.py --category track --state TX --limit 1` or similar safe command) to verify that it executes cleanly. Write your implementation report to `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m1\handoff.md` including the test verification commands and their output. Do NOT write metadata files to other folders.
