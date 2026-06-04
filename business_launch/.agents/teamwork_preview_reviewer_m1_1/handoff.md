# Handoff Report: Milestone 1 Review — gridpass.app

## 1. Observation
We observed the following configurations and implementations:

* **File Paths and Existence**:
  * `leads.csv` is located at `c:\_Projects\Gridpass-v4\business_launch\leads.csv`.
  * `find_leads.py` is located at `c:\_Projects\Gridpass-v4\business_launch\find_leads.py`.
  * `test_leads.py` is located at `c:\_Projects\Gridpass-v4\business_launch\test_leads.py`.
  * `PROJECT.md` is located at `c:\_Projects\Gridpass-v4\business_launch\PROJECT.md`.

* **CSV Data Entries**:
  We read `leads.csv` and confirmed 52 entries under the exact header `Name,Category,Location,Website,Email,Phone,Instagram,Facebook`.
  Lines 33, 34, and 37 feature California State Parks Offroad SVRA sites:
  ```csv
  33: Prairie City SVRA,Offroad & Adventure Park,"Rancho Cordova, CA",https://www.ohv.parks.ca.gov/?page_id=1178,prairiecity@parks.ca.gov,(916) 985-7343,https://www.instagram.com/prairiecitysvra,https://www.facebook.com/PrairieCitySVRA
  34: Hollister Hills SVRA,Offroad & Adventure Park,"Hollister, CA",https://www.ohv.parks.ca.gov/?page_id=1179,hollisterhills@parks.ca.gov,(831) 637-3874,https://www.instagram.com/hollisterhillssvra,https://www.facebook.com/HollisterHillsSVRA
  37: Hungry Valley SVRA,Offroad & Adventure Park,"Gorman, CA",https://www.ohv.parks.ca.gov/?page_id=1184,hungryvalley@parks.ca.gov,(661) 248-7007,https://www.instagram.com/hungryvalleysvra,https://www.facebook.com/HungryValleySVRA
  ```

* **Test Suite Deduplication Logic**:
  In `test_leads.py` (lines 63-66):
  ```python
  def norm_domain(url):
      if not url: return ""
      domain = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
      return domain.split('/')[0].strip()
  ```
  And in `test_leads.py` (lines 87-94):
  ```python
  # Check website domain duplication
  if n_dom:
      self.assertNotIn(
          n_dom, 
          domains, 
          f"Row {idx}: Duplicate website domain detected: {website} (normalized: {n_dom})"
      )
      domains.add(n_dom)
  ```

* **Scraper Deduplication Logic**:
  In `find_leads.py` (lines 39-56):
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

---

## 2. Logic Chain
1. **Observation 1**: In `leads.csv`, Row 33 has website `https://www.ohv.parks.ca.gov/?page_id=1178`. Row 34 has website `https://www.ohv.parks.ca.gov/?page_id=1179`.
2. **Observation 2**: `test_leads.py` normalizes URLs in `norm_domain()` by removing protocols, `www.`, and splitting by `/` to keep only the base domain segment.
3. **Reasoning Step**: Under `norm_domain()`, `https://www.ohv.parks.ca.gov/?page_id=1178` yields `ohv.parks.ca.gov`, and `https://www.ohv.parks.ca.gov/?page_id=1179` also yields `ohv.parks.ca.gov`.
4. **Observation 3**: `test_leads.py` asserts that every normalized domain is globally unique inside the list `domains` and fails if it is already present.
5. **Conclusion**: When `test_leads.py` processes Row 34, it retrieves `n_dom = "ohv.parks.ca.gov"`. Since it processed Row 33 first, `"ohv.parks.ca.gov"` is already in `domains`, triggering `self.assertNotIn(...)` and failing the test suite with a duplicate domain error.

---

## 3. Caveats
* **Network Execution Environment**: Because the system is operating in a CODE_ONLY restricted environment and commands require interactive user permission (which timed out during execution), we did not run the test suite live. However, the logic failure is mathematically certain from the code structure and static data analysis.
* **Intended Deduplication Scope**: We assumed that the original developer intended to prevent company duplication via domain checks, but overlooked that government SVRAs are hosted as query-string endpoints under a single shared domain root.

---

## 4. Conclusion
Milestone 1 **FAILS** automated verification due to a domain deduplication collision on California State Parks SVRA entries in `leads.csv` (Row 33, 34, and 37). While the database size (52 entries), structure, layouts, and scraper design are of high quality and satisfy `PROJECT.md` contracts, the verification script `test_leads.py` is currently broken and throws an assertion error when run.

**Actionable Recommendation**:
The domain normalization logic must be updated to either:
1. Uniquely identify sites using the *full URL* or the subpage parameters when known shared platforms are used.
2. Filter out known shared domains (like `*.gov`, `*.scca.org`, `*.facebook.com`) from base domain deduplication constraints.

---

## 5. Verification Method
To independently verify this logic failure, run:
```bash
python test_leads.py
```
**Expected Error Output**:
```
AssertionError: Row 34: Duplicate website domain detected: https://www.ohv.parks.ca.gov/?page_id=1179 (normalized: ohv.parks.ca.gov)
```
This confirms that the test suite fails under standard execution.
