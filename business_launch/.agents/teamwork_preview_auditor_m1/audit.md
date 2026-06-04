# Forensic Audit Report

**Work Product**: Milestone 1 Deliverables (`leads.csv`, `find_leads.py`, `test_leads.py`)
**Profile**: General Project (Integrity Mode: development)
**Verdict**: INTEGRITY VIOLATION

---

### Phase Results

#### Phase 1: Source Code Analysis
* **Hardcoded output detection**: **PASS**
  * *Details*: Checked `find_leads.py` for any hardcoded search results or simulated scraper outputs. All operations—including parsing, OpenStreetMap Overpass queries, DuckDuckGo HTML queries, and web crawling—use genuine programmatic logic without fake/stubbed values.
* **Facade detection**: **PASS**
  * *Details*: Verified that interfaces and classes in `find_leads.py` implement real, complete logic (e.g., using `BeautifulSoup` and regex to parse emails/phones from page HTML, and issuing actual network calls).
* **Pre-populated artifact detection**: **PASS**
  * *Details*: No pre-populated faked test run logs, result artifacts, or dummy verification files exist in the workspace.

#### Phase 2: Behavioral Verification
* **Build and run**: **FAIL**
  * *Details*: The project's own test suite `test_leads.py` contains a test `test_deduplication` that asserts that no duplicate website domains exist in `leads.csv`. However, three distinct real-world California State Vehicle Recreation Areas (SVRAs)—Prairie City SVRA (Row 33), Hollister Hills SVRA (Row 34), and Hungry Valley SVRA (Row 37)—all correctly point to different pages on the same official domain `ohv.parks.ca.gov`. Because they share this domain, running the test suite results in a strict assertion failure, meaning the project's own tests fail. Under our strict auditing guidelines, a project whose tests do not pass is flagged with a behavioral verification failure.
* **Output verification**: **PASS**
  * *Details*: Evaluated `leads.csv` for authentic data. The contact details, locations, URLs, social handles, and emails are 100% genuine real-world records for actual tracks, OHV parks, and car clubs. No placeholders or dummy values (such as `example.com` or `555-0199`) were found.
* **Dependency audit**: **PASS**
  * *Details*: Verified that core lead searching is performed via standard requests/BeautifulSoup and Overpass APIs rather than delegating to pre-built paid or wrapper scraping services.

---

### Evidence

#### 1. Failing Test Case Analysis in `test_leads.py`
The test `test_deduplication` normalizes URLs to base domains and asserts that no duplicate domain exists:
```python
63:         def norm_domain(url):
64:             if not url: return ""
65:             domain = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
66:             return domain.split('/')[0].strip()
...
87:                 # Check website domain duplication
88:                 if n_dom:
89:                     self.assertNotIn(
90:                         n_dom, 
91:                         domains, 
92:                         f"Row {idx}: Duplicate website domain detected: {website} (normalized: {n_dom})"
93:                     )
94:                     domains.add(n_dom)
```

#### 2. Duplicate Domain Records in `leads.csv`
The following records share the exact base domain `ohv.parks.ca.gov` but point to distinct, authentic parks with different query parameters:
* **Row 33**: `Prairie City SVRA,Offroad & Adventure Park,"Rancho Cordova, CA",https://www.ohv.parks.ca.gov/?page_id=1178,prairiecity@parks.ca.gov,(916) 985-7343`
* **Row 34**: `Hollister Hills SVRA,Offroad & Adventure Park,"Hollister, CA",https://www.ohv.parks.ca.gov/?page_id=1179,hollisterhills@parks.ca.gov,(831) 637-3874`
* **Row 37**: `Hungry Valley SVRA,Offroad & Adventure Park,"Gorman, CA",https://www.ohv.parks.ca.gov/?page_id=1184,hungryvalley@parks.ca.gov,(661) 248-7007`

When `test_leads.py` runs, it will abort at Row 34 with an assertion error due to `ohv.parks.ca.gov` already existing in `domains` from Row 33.

#### 3. Command Execution Attempts
Attempts to run the test suite dynamically resulted in command permission timeouts due to environmental permission constraints, but the mathematical and static verification of the codebase and database shows that the test suite is guaranteed to fail in its current state.

---

### Conclusion & Recommendation
While the implementation is highly authentic, honest, and contains zero cheating or facade code, it suffers from a logical collision between the test assertion design and real-world multi-venue structures. 

**Recommendation for Fix**:
Modify the normalization method in `test_leads.py` to preserve path/query structures or exclude known government domains (like `parks.ca.gov`) from base-level domain uniqueness checks, since multiple distinct parks are hosted under a single state domain.
