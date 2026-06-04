## 2026-05-22T15:00:08Z
You are a Read-only exploration agent. Your working directory is c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_explorer_m1_1_gen2.
Your mission is to explore and propose a fix strategy for the duplicate domain normalization bug in Milestone 1.

### Forensic Auditor and Reviewers Evidence Report (FAIL / INTEGRITY VIOLATION):
- **Verdict**: INTEGRITY VIOLATION / FAIL (due to test suite failure during behavioral verification).
- **Core Cause**: The test `test_deduplication` in `test_leads.py` and duplication checks in `find_leads.py` use a simplified `norm_domain()` utility that strips query strings and subpaths, collapsing separate SVRAs like Prairie City SVRA (`https://www.ohv.parks.ca.gov/?page_id=1178`) and Hollister Hills SVRA (`https://www.ohv.parks.ca.gov/?page_id=1179`) to the bare domain `ohv.parks.ca.gov`. This triggers a strict `AssertionError` in `test_leads.py` and causes the programmatic scraper to skip legitimate distinct venues.
- **Specific Lines**:
  ```python
  def norm_domain(url):
      if not url: return ""
      domain = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
      return domain.split('/')[0].strip()
  ```

Please:
1. Examine `c:\_Projects\Gridpass-v4\business_launch\find_leads.py` and `c:\_Projects\Gridpass-v4\business_launch\test_leads.py`.
2. Propose a refined URL normalization scheme or de-duplication strategy that preserves query arguments or path signatures for large shared portals (or government domains like `ohv.parks.ca.gov`, `nps.gov`, etc.) or compares full canonical URLs.
3. Keep the de-duplication robust so that actual duplicate entries are still correctly caught (e.g. comparing normalized Name+Location combined with normalized Website/URL).

Write your fix strategy report to `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_explorer_m1_1_gen2\analysis.md`. Do NOT write code or modify the source files directly. Just explore and write your analysis.
