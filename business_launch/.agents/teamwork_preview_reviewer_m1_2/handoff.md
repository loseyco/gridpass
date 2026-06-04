# Handoff Report — Milestone 1 Review

## 1. Observation
I have inspected the following files in the `c:\_Projects\Gridpass-v4\business_launch\` workspace:
- `leads.csv` (contains 54 lines, including 1 header line and 53 lead entries).
- `find_leads.py` (contains 644 lines, programmatic lead finder script).
- `test_leads.py` (contains 152 lines, unittest suite).
- `PROJECT.md` (architecture, milestones, and interface contract).

Specifically, I observed the following in these files:
- **`leads.csv` Headers (line 1)**:
  `Name,Category,Location,Website,Email,Phone,Instagram,Facebook`
- **`leads.csv` California State Parks (SVRA) entries (lines 33, 34, 37)**:
  - Line 33: `Prairie City SVRA,Offroad & Adventure Park,"Rancho Cordova, CA",https://www.ohv.parks.ca.gov/?page_id=1178,prairiecity@parks.ca.gov,(916) 985-7343,https://www.instagram.com/prairiecitysvra,https://www.facebook.com/PrairieCitySVRA`
  - Line 34: `Hollister Hills SVRA,Offroad & Adventure Park,"Hollister, CA",https://www.ohv.parks.ca.gov/?page_id=1179,hollisterhills@parks.ca.gov,(831) 637-3874,https://www.instagram.com/hollisterhillssvra,https://www.facebook.com/HollisterHillsSVRA`
  - Line 37: `Hungry Valley SVRA,Offroad & Adventure Park,"Gorman, CA",https://www.ohv.parks.ca.gov/?page_id=1184,hungryvalley@parks.ca.gov,(661) 248-7007,https://www.instagram.com/hungryvalleysvra,https://www.facebook.com/HungryValleySVRA`
- **`test_leads.py` norm_domain function (lines 63-66)**:
  ```python
  def norm_domain(url):
      if not url: return ""
      domain = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
      return domain.split('/')[0].strip()
  ```
- **`test_leads.py` test_deduplication loop (lines 76-95)**:
  ```python
  with open(self.csv_path, "r", encoding="utf-8") as f:
      reader = csv.DictReader(f)
      for idx, row in enumerate(reader, start=2):
          ...
          n_dom = norm_domain(website)
          ...
          if n_dom:
              self.assertNotIn(
                  n_dom, 
                  domains, 
                  f"Row {idx}: Duplicate website domain detected: {website} (normalized: {n_dom})"
              )
              domains.add(n_dom)
  ```
- **`find_leads.py` is_duplicate logic (lines 186-198)**:
  ```python
  def is_duplicate(self, name, location, website):
      """Checks duplicate presence using both primary and secondary keys."""
      n_dom = norm_domain(website)
      ...
      if n_dom and n_dom in self.existing_domains:
          return True
      ...
  ```
- **Terminal Execution Limitation**:
  An attempt to execute `python -m py_compile find_leads.py test_leads.py` using `run_command` timed out waiting for user approval:
  `Permission prompt for action 'command' on target 'python -m py_compile find_leads.py test_leads.py' timed out waiting for user response.`

## 2. Logic Chain
1. `leads.csv` contains multiple California State Parks entries (Prairie City SVRA, Hollister Hills SVRA, and Hungry Valley SVRA).
2. Each of these entries has a distinct URL that points to a specific subpage under `https://www.ohv.parks.ca.gov/` using a query parameter (e.g. `?page_id=1178`, `?page_id=1179`, `?page_id=1184`).
3. The `norm_domain` function in `test_leads.py` splits the URL at the first forward-slash `/` to extract the base domain. Therefore, all three distinct SVRAs are normalized to the base domain `"ohv.parks.ca.gov"`.
4. In `test_leads.py`, `test_deduplication` iterates over each row of `leads.csv` and asserts that the normalized domain `n_dom` does not already exist in the `domains` set.
5. On Row 34 (Hollister Hills SVRA), its normalized domain `"ohv.parks.ca.gov"` is already in `domains` (added from Row 33, Prairie City SVRA), causing the assertion `self.assertNotIn` to fail.
6. Thus, the test suite `test_leads.py` is guaranteed to fail its domain deduplication test under the current `leads.csv` dataset.
7. Similarly, `find_leads.py`'s `is_duplicate` check uses the identical aggressive domain normalizer, meaning `find_leads.py` will incorrectly skip legitimate, unique state vehicular parks or local portals sharing a domain.
8. Therefore, the implementation fails correctness and database validation criteria.

## 3. Caveats
- I did not physically execute the Python files (`find_leads.py`, `test_leads.py`) or the crawler functionality due to the terminal command permission timeout.
- I assumed the standard behavior of standard Python libraries (`unittest`, `csv`, `re`) as used in the source code.
- My review is restricted to static codebase inspection and logic tracing.

## 4. Conclusion
The Milestone 1 work product is **FAIL / REQUEST_CHANGES**. Although the code style is exceptional and the scraping fallbacks are well-engineered, the test suite will fail to pass in its current state because the domain deduplication logic (`norm_domain`) is too aggressive and incorrectly treats distinct portal-based venue pages sharing a root domain as duplicates.

## 5. Verification Method
To verify this finding independently, execute the following commands in the workspace root directory:
```powershell
# Run the test suite to observe the domain deduplication failure
python test_leads.py
```
**Expected Output**:
An `AssertionError` matching the following signature:
`AssertionError: Row 34: Duplicate website domain detected: https://www.ohv.parks.ca.gov/?page_id=1179 (normalized: ohv.parks.ca.gov)`
