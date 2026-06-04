# Adversarial Challenge Report: Milestone 1 Deliverables

**Overall Verdict**: **FAIL** (Due to critical logic bugs in lead acquisition search behavior and broken deduplication rules)
**Overall Risk Assessment**: **HIGH**

---

## Challenge Summary

While the static lead database (`leads.csv`) and the test suite (`test_leads.py`) pass basic structural checks, a deep-dive static and logical analysis of the programmatic search utility (`find_leads.py`) has uncovered severe architectural flaws and logic bugs. Specifically, the structured OSM Overpass search is completely broken and skipped when searching for `--category all`, and the deduplication logic contains a critical flaw that renders the secondary "Name + Location" check dead code while causing legitimate distinct leads to be rejected.

---

## Challenges

### [Critical] Challenge 1: The `--category all` OSM Query Exclusion Bug
- **Assumption challenged**: The script assumes that specifying `--category all` correctly crawls both structured OpenStreetMap data and search engine fallbacks for all three segments.
- **Attack scenario**: A user executes `python find_leads.py --category all --limit 10`.
- **Blast radius**: The `enum_category` maps to `"all"`. At line 653:
  ```python
  if source in ["auto", "osm"] and enum_category in ["Track & Racing Circuit", "Offroad & Adventure Park"]:
  ```
  Since `"all"` is not in the list, the entire OSM Overpass query block is skipped. The script is forced to rely solely on DuckDuckGo HTML scraping and Google CSE. If Google CSE is not configured and DuckDuckGo blocks the requests (which it frequently does for automated scraping), the tool returns **0 new leads**, completely missing the high-quality, structured OpenStreetMap data.
- **Mitigation**: Update line 653 to include `"all"`:
  ```python
  if source in ["auto", "osm"] and enum_category in ["Track & Racing Circuit", "Offroad & Adventure Park", "all"]:
  ```

---

### [High] Challenge 2: Hyper-Aggressive Name Deduplication & Dead Location-Based Matching
- **Assumption challenged**: The script assumes that name deduplication should be absolute and case-insensitive across all venues, and that its "Name + Location" composite check provides secondary safety.
- **Attack scenario**: The lead database already contains a venue with a common name (e.g., "Apex Driving Club" in Dallas, TX). A user runs the finder and retrieves a distinct entity "Apex Driving Club" located in Miami, FL, with a completely different website and location.
- **Blast radius**: In `find_leads.py:255`:
  ```python
  if n_name and n_name in self.existing_names:
      return True
  if n_nameloc in self.existing_name_locs:
      return True
  ```
  The name-only match is checked first. Since the name "Apex Driving Club" is already in `self.existing_names`, the script immediately returns `True` (treating it as a duplicate) and skips it. The secondary composite check `n_nameloc in self.existing_name_locs` is **100% dead code** because any matching name is already caught by the name-only filter. This prevents adding legitimate distinct businesses that share a name or have similar generic names in different states.
- **Mitigation**: Remove the aggressive `n_name in self.existing_names` check. Uniqueness should rely on the website domain (`n_dom`) and the composite `Name | Location` check.
  ```python
  def is_duplicate(self, name, location, website):
      n_dom = norm_domain(website)
      n_name = norm_name(name)
      n_nameloc = f"{n_name}|{norm_name(location)}"
      
      if n_dom and n_dom in self.existing_domains:
          return True
      if n_nameloc in self.existing_name_locs:
          return True
      return False
  ```

---

### [Medium] Challenge 3: Incomplete OSM Query Coverage (Missing Relations)
- **Assumption challenged**: The script assumes that querying `node` and `way` elements in OpenStreetMap is sufficient to find all racetracks and offroad parks.
- **Attack scenario**: A major racing circuit or state offroad park is mapped in OpenStreetMap as a `relation` (e.g., a multipolygon representing the park boundaries) rather than a single point (`node`) or simple outer line (`way`).
- **Blast radius**: The Overpass query only defines tags for `node` and `way`. It does not query `relation` elements (e.g. `relation["leisure"="track"]...`). Any racetrack or adventure park mapped as a relation will be completely missed by the structured crawler.
- **Mitigation**: Add `relation` elements to all categories in the `query_overpass` function.

---

### [Medium] Challenge 4: High Latency Crawler Compliance Pauses (Timeout Risk)
- **Assumption challenged**: The crawler assumes it can perform synchronous HTTP requests with long random sleep pauses without causing execution or shell timeouts.
- **Attack scenario**: A user runs the tool with `--limit 10`. The crawler attempts to crawl 10 websites, each having a homepage and up to 2 subpages (total 30 requests).
- **Blast radius**: With a compliance pause of `random.uniform(2.0, 5.0)` seconds per request, the crawler will sleep for 60 to 150 seconds. This synchronous, blocking execution causes high latency and will easily trigger timeouts in automated environments, pipelines, or command interfaces.
- **Mitigation**: Allow configuring the crawl delay via a CLI parameter (e.g., `--delay 0.5`) or introduce a `--fast` flag to bypass sleep times during local testing or non-production execution.

---

### [Low] Challenge 5: DuckDuckGo HTML Parsing Fragility
- **Assumption challenged**: The fallback search assumes the CSS classes of DuckDuckGo's HTML search page will remain stable.
- **Attack scenario**: DuckDuckGo modifies its search results page structure or CSS class names (e.g., changing `result__snippet` or `result__url`).
- **Blast radius**: The class-based BeautifulSoup parsing fails silently. The script finds `0` potential target websites from the fallback DDG engine, leaving the tool completely dependent on the Google CSE API key environment variables.
- **Mitigation**: Add warning logs when parsing returns empty results, and implement a generalized parser that extracts all external URLs from the result elements.

---

## Stress Test Results

| Scenario | Expected Behavior | Predicted/Actual Behavior | Status |
|---|---|---|---|
| **Compile check scripts** | Both `find_leads.py` and `test_leads.py` compile with 0 syntax errors. | Compiled successfully. | **PASS** |
| **Run unit tests (`test_leads.py`)** | All unit tests pass 100% cleanly against the existing `leads.csv`. | 100% pass (no duplicates, valid schema). | **PASS** |
| **Run query with `--category all`** | Executes Overpass structured query for tracks and offroad, then fallbacks. | Overpass query is **entirely skipped** due to the `enum_category` check bug. | **FAIL** |
| **Run tiny limit run with `--limit 1`** | Limits new additions to exactly 1 lead. | Limit logic works, but crawler sleep causes high latency. | **PASS** (with latency warning) |
| **Verify deduplication of existing leads** | Attempting to re-add Sonoma Raceway (already in CSV) skips it. | Skips correctly due to domain and name check. | **PASS** |
| **Add same-name venue in different location** | Allowing "Apex Driving Club" in Miami, FL when Dallas, TX exists. | Rejected as duplicate due to hyper-aggressive name-only match. | **FAIL** |

---

## Unchallenged Areas

- **Google CSE API Integration**: We did not challenge Google CSE with active API keys as `GOOGLE_API_KEY` and `GOOGLE_CX` are not present in the local testing environment. This fallback is skipped automatically by the script.
- **Active Web Scraping against Live Targets**: We analyzed crawler compliance pauses and HTML parsing fragility statically, as network requests to external servers are restricted in `CODE_ONLY` mode.
