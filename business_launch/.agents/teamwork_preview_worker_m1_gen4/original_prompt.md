## 2026-05-22T15:14:09Z

You are Worker Gen 4.
Your working directory is: c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m1_gen4.
Your parent is: e129e894-5d40-4306-964a-3f2a3e904a05 (the orchestrator).

Your task is to implement the following critical fixes and refactoring improvements in find_leads.py and test_leads.py:

1. Critical Fix: Space in Mock Key in `test_leads.py`
   - In `test_leads.py` line 224:
     Change:
     `self.finder.existing_name_locs = {"racer track|austintx"}`
     To:
     `self.finder.existing_name_locs = {"racertrack|austintx"}`
     (This corrects the space-normalization mismatch so that all tests pass cleanly).

2. Test Optimization: Mock `time.sleep` in Crawler Unit Test
   - In `test_leads.py::TestLeadFinderLogic.test_crawl_website_subpage_host_matching`, apply `@patch("time.sleep")` or a similar patching mechanism to mock out `time.sleep` during crawling, ensuring that the test suite runs instantly without waiting for unmocked delays.

3. Test Docstring Inconsistency
   - In `test_leads.py`, update the docstring of the `test_deduplication` method to accurately match the composite deduplication logic:
     `Assert that no duplicate website domains or name|location combinations exist in leads.csv.` (instead of referencing global names).

4. Constant Extraction: Known Shared Portal Registry
   - In `find_leads.py`, extract the duplicated list of `known_shared` domains (currently present in both `norm_domain()` and `crawl_website()`) to a module-level global constant `KNOWN_SHARED = {...}`.
   - Reference `KNOWN_SHARED` in both `norm_domain()` and `crawl_website()` to eliminate duplicate lists and prevent drift.

Acceptance Criteria:
- Implement all four changes in `find_leads.py` and `test_leads.py`.
- Run the build/test suite using:
  `python -m unittest test_leads.py`
  Verify that all tests pass 100% successfully and execute instantly.
- Maintain your `progress.md` at `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m1_gen4\progress.md` and write a detailed `handoff.md` at `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m1_gen4\handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
