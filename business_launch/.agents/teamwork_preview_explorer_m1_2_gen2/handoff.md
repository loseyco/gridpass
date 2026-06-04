# Handoff Report: Milestone 1 Duplicate Domain Normalization Bug

This handoff contains all observations, logical analyses, findings, and the proposed fix strategy for resolving the duplicate domain normalization failure in Milestone 1.

---

## 1. Observation

### 1.1 Codebase Structure & Files
We inspected the following primary project files:
- **Scraper / Lead Finder**: `c:\_Projects\Gridpass-v4\business_launch\find_leads.py`
- **Unit Test Suite**: `c:\_Projects\Gridpass-v4\business_launch\test_leads.py`
- **Leads Database**: `c:\_Projects\Gridpass-v4\business_launch\leads.csv`

### 1.2 The Faulty Deduplication Utilities
We observed that `norm_domain()` is defined in two separate locations:

**In `find_leads.py` (Lines 39-56):**
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

**In `test_leads.py` (Nested inside `test_deduplication` at Lines 63-66):**
```python
        def norm_domain(url):
            if not url: return ""
            domain = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
            return domain.split('/')[0].strip()
```

Both implementations split by `/`, which removes any subpaths, and `find_leads.py` also splits by `?` and `#`, which strips all query strings.

### 1.3 Target Data Collisions in `leads.csv`
We observed that the `leads.csv` database contains several distinct California State Vehicular Recreation Areas (SVRAs) that share a government portal domain but use unique query parameters to identify the separate physical parks (Lines 33, 34, 37):

```csv
33: Prairie City SVRA,Offroad & Adventure Park,"Rancho Cordova, CA",https://www.ohv.parks.ca.gov/?page_id=1178,prairiecity@parks.ca.gov,(916) 985-7343,https://www.instagram.com/prairiecitysvra,https://www.facebook.com/PrairieCitySVRA
34: Hollister Hills SVRA,Offroad & Adventure Park,"Hollister, CA",https://www.ohv.parks.ca.gov/?page_id=1179,hollisterhills@parks.ca.gov,(831) 637-3874,https://www.instagram.com/hollisterhillssvra,https://www.facebook.com/HollisterHillsSVRA
...
37: Hungry Valley SVRA,Offroad & Adventure Park,"Gorman, CA",https://www.ohv.parks.ca.gov/?page_id=1184,hungryvalley@parks.ca.gov,(661) 248-7007,https://www.instagram.com/hungryvalleysvra,https://www.facebook.com/HungryValleySVRA
```

Running `norm_domain()` on each of these URLs collapses them all to the single base domain: `ohv.parks.ca.gov`.

---

## 2. Logic Chain

1. **Test Failure Mechanism**: The test `test_leads.py::test_deduplication` iterates through `leads.csv` and records normalized domains in a set named `domains`.
   - On row 33 (`Prairie City SVRA`), it normalizes `https://www.ohv.parks.ca.gov/?page_id=1178` to `ohv.parks.ca.gov` and inserts it into `domains`.
   - On row 34 (`Hollister Hills SVRA`), it normalizes `https://www.ohv.parks.ca.gov/?page_id=1179` to `ohv.parks.ca.gov`.
   - It checks `self.assertNotIn("ohv.parks.ca.gov", domains)`. Since the domain is present, it throws a strict `AssertionError`, halting verification.
2. **Scraper Skip Mechanism**: In `find_leads.py`, `is_duplicate()` uses `norm_domain()` to compare new web candidates with existing domains. Once `Prairie City SVRA` is in the database, any new SVRA matching `ohv.parks.ca.gov` is falsely flagged as a duplicate and skipped, causing a behavioral scraper failure.
3. **Refined Solution Requirement**: To fix this, we need a refined domain normalization utility that preserves the full URL signature (paths and parameters) *only* for large shared portals (like government, federal, and state directories, e.g., `.gov`, `.us`, `.net` city websites) while maintaining strict base domain truncation for standard standalone sites (like `sonomaraceway.com`).
4. **Scope of the Fix**: Because `norm_domain()` is implemented independently in `find_leads.py` and `test_leads.py`, both files must be updated to align their normalization logic.

---

## 3. Caveats

- **External Hostnames**: The explicit list of known shared portals (`parks.ca.gov`, `in.gov`, etc.) covers all shared portals currently in `leads.csv`. To ensure long-term coverage of new, unlisted state park portals or federal directories that do not end in `.gov`, we have added suffix matching for state portals (e.g. `.us` domains) and generic `.gov` handling.
- **Deduplication Sensitivity**: Standalone domains are still strictly normalized to their hostnames to avoid duplicate listings of the same venue due to slightly different landing paths (e.g. `site.com` vs `site.com/contact`).
- **No Command Run**: The terminal commands (`run_command`) timed out due to security permission requirements on the user environment. The logic was verified through visual inspection and rigorous dry-run tracing.

---

## 4. Conclusion

The duplicate domain normalization bug is an integrity violation that impacts both the data validator and the crawler tool. The recommended solution is to apply a **Shared Portal Filter Pattern** that preserves URL paths and query arguments for government, federal, and state-level websites while maintaining strict hostname truncation for private businesses. A precise code patch `fix_domain_normalization.patch` has been written to the working directory.

---

## 5. Verification Method

To verify the fix:
1. Apply the patch `fix_domain_normalization.patch` to the codebase.
2. Run the test suite:
   ```powershell
   python test_leads.py
   ```
   *Expected result*: The test suite completes successfully without any assertions or failures.
3. Test scraper behavior:
   ```powershell
   python find_leads.py --state CA --category offroad --limit 5
   ```
   *Expected result*: The scraper executes without skips when handling multiple distinct SVRAs or shared portals.
