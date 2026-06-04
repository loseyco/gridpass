# Handoff Report: Duplicate Domain Normalization Fix Strategy

This handoff report summarizes the read-only exploration and proposed fix strategy for the domain normalization bug in Milestone 1.

---

## 1. Observation

Direct observations made within the workspace:

- **Exact File Paths**:
  - `c:\_Projects\Gridpass-v4\business_launch\find_leads.py`
  - `c:\_Projects\Gridpass-v4\business_launch\test_leads.py`
  - `c:\_Projects\Gridpass-v4\business_launch\leads.csv`
  - `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_explorer_m1_3_gen2\analysis.md`

- **Verbatim Code Slices**:
  - In `find_leads.py` (lines 39-56), `norm_domain()` is defined as:
    ```python
    def norm_domain(url):
        """Normalize a website URL to its base domain for deduplication."""
        if not url:
            return ""
        url_lower = url.lower()
        # Strip protocol
        if url_lower.startswith("https://"):
            domain = url_lower[8:]
        elif url_lower.startswith("http://"):
            domain = url_lower[7:]
        else:
            domain = url_lower
        # Strip www.
        if domain.startswith("www."):
            domain = domain[4:]
        # Strip paths, parameters, and trailing slashes
        domain = domain.split('/')[0].split('?')[0].split('#')[0].strip()
        return domain
    ```
  - In `test_leads.py` (lines 63-66), a simplified helper inside `test_deduplication` is defined as:
    ```python
    def norm_domain(url):
        if not url: return ""
        domain = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
        return domain.split('/')[0].strip()
    ```
  - In `leads.csv`, lines 33, 34, and 37 feature the following values:
    ```csv
    Row 33: Prairie City SVRA,Offroad & Adventure Park,"Rancho Cordova, CA",https://www.ohv.parks.ca.gov/?page_id=1178,prairiecity@parks.ca.gov,(916) 985-7343,https://www.instagram.com/prairiecitysvra,https://www.facebook.com/PrairieCitySVRA
    Row 34: Hollister Hills SVRA,Offroad & Adventure Park,"Hollister, CA",https://www.ohv.parks.ca.gov/?page_id=1179,hollisterhills@parks.ca.gov,(831) 637-3874,https://www.instagram.com/hollisterhillssvra,https://www.facebook.com/HollisterHillsSVRA
    Row 37: Hungry Valley SVRA,Offroad & Adventure Park,"Gorman, CA",https://www.ohv.parks.ca.gov/?page_id=1184,hungryvalley@parks.ca.gov,(661) 248-7007,https://www.instagram.com/hungryvalleysvra,https://www.facebook.com/HungryValleySVRA
    ```

---

## 2. Logic Chain

1. **Premise**: The local test utility `norm_domain()` inside `test_leads.py` and the main utility `norm_domain()` inside `find_leads.py` strip all subpaths and query strings, taking only the domain: `domain.split('/')[0]`.
2. **Impact on leads.csv**: When `test_leads.py` parses `leads.csv`, Row 33 (`https://www.ohv.parks.ca.gov/?page_id=1178`) normalizes to `ohv.parks.ca.gov`. Row 34 (`https://www.ohv.parks.ca.gov/?page_id=1179`) also normalizes to `ohv.parks.ca.gov`.
3. **Behavioral Failure**: The test `test_deduplication` asserts that each normalized domain is unique:
   ```python
   if n_dom:
       self.assertNotIn(
           n_dom, 
           domains, 
           f"Row {idx}: Duplicate website domain detected: {website} (normalized: {n_dom})"
       )
   ```
   This assertion throws a hard `AssertionError` because `ohv.parks.ca.gov` is loaded twice (first for Row 33, then for Row 34).
4. **Programmatic Scraper Skipping**: In `find_leads.py`, `is_duplicate()` uses `norm_domain` to check if a venue is a duplicate. When importing or searching for new leads, if any lead shares a domain with an existing portal (e.g. any new California state park/SVRA, or any new BLM/NPS site), it is skipped entirely as a false positive duplicate.
5. **Resolution**: Implementing a **hybrid normalization scheme** that preserves subpaths and sorted query parameters specifically for public/shared portal domains (recognized via a suffix check e.g. `.gov` or a known domain list) ensures that these distinct venues remain unique while keeping ordinary base domains (like `sonomaraceway.com`) strictly deduplicated.

---

## 3. Caveats

- **Assumptions**: We assume the scraper should only keep query parameters (like `page_id`) and subpaths for domains that represent shared directories or government portals. For normal businesses, they should continue to collapse to the base domain (to prevent duplicates where one entry has a subpath and the other does not).
- **Tracking Parameters**: The proposed strategy discards query variables like `utm_source` and `ref` to ensure that marketing trackers do not prevent correct deduplication.

---

## 4. Conclusion

The duplicate domain normalization bug is caused by collapsing all URLs to their base domain, which conflates distinct venues hosted on shared public directories (e.g., California state park/SVRA system). 

To resolve the issue:
1. Update `norm_domain` in both `find_leads.py` and `test_leads.py` to use a domain-aware normalization logic.
2. The logic must recognize shared portals (like `.gov` domains or a set of known directory domains) and preserve their path and query signatures while collapsing standard business URLs to base domains.
3. This allows the test suite to pass perfectly and enables correct crawling of multi-venue portals.

---

## 5. Verification Method

To verify the proposed fix independently:
1. Review the detailed fix strategy and proposed python code in `c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_explorer_m1_3_gen2\analysis.md`.
2. Implement the proposed `norm_domain(url)` function in both `find_leads.py` (lines 39-56) and `test_leads.py` (lines 63-66).
3. Execute the unit test suite inside the workspace:
   ```powershell
   python -m unittest test_leads.py
   ```
4. **Expected Result**: The test suite should execute and pass without any `AssertionError`s, proving that all 50+ leads inside `leads.csv` are unique and robustly verified.
