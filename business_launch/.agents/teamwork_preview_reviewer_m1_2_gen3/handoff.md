# Handoff Report - Milestone 1 Lead Finder & Database Review

## 1. Observation
We conducted a comprehensive, independent code and data review of the files `find_leads.py`, `test_leads.py`, and `leads.csv` in `c:\_Projects\Gridpass-v4\business_launch`.

Key findings from observations:
- **`find_leads.py` (lines 458-481)**:
  ```python
  tags = []
  if category in ['track', 'tracks', 'all']:
      tags.extend([
          'node["leisure"="track"]["sport"~"motor|karting"](area.searchArea);',
          'way["leisure"="track"]["sport"~"motor|karting"](area.searchArea);',
          'relation["leisure"="track"]["sport"~"motor|karting"](area.searchArea);',
          ...
      ])
  if category in ['offroad', 'all']:
      tags.extend([
          'node["leisure"="offroad"](area.searchArea);',
          ...
      ])
  ```
  Both track and offroad tags are successfully added when `category == 'all'`, and relations are included.
- **`find_leads.py` (lines 249-260)**:
  ```python
  def is_duplicate(self, name, location, website):
      """Checks duplicate presence using both primary and secondary keys."""
      n_dom = norm_domain(website)
      n_name = norm_name(name)
      n_nameloc = f"{n_name}|{norm_name(location)}"
      
      if n_dom and n_dom in self.existing_domains:
          return True
      if n_nameloc in self.existing_name_locs:
          return True
      return False
  ```
  Global name uniqueness is no longer checked (`self.existing_names` is not in `is_duplicate`), while composite `name|location` and normalized domain uniqueness are strictly enforced.
- **`find_leads.py` (lines 388-397)**:
  ```python
  parsed_sub = urllib.parse.urlparse(full_sub_url)
  sub_host = parsed_sub.netloc.lower()
  if sub_host.startswith("www."):
      sub_host = sub_host[4:]
  
  if sub_host == home_host and full_sub_url not in visited_urls:
  ```
  The crawler uses bare host comparison (`sub_host == home_host`) for subpage discovery instead of comparing `norm_domain(full_sub_url) == domain`, preventing premature sub-path discard.
- **`leads.csv` (lines 33-37)**:
  Distinct pages on the CA State Parks shared portal co-exist without being flagged as duplicates:
  - Row 33: `Prairie City SVRA,Offroad & Adventure Park,"Rancho Cordova, CA",https://www.ohv.parks.ca.gov/?page_id=1178...`
  - Row 34: `Hollister Hills SVRA,Offroad & Adventure Park,"Hollister, CA",https://www.ohv.parks.ca.gov/?page_id=1179...`
  - Row 37: `Hungry Valley SVRA,Offroad & Adventure Park,"Gorman, CA",https://www.ohv.parks.ca.gov/?page_id=1184...`
- **`test_leads.py` (lines 226-278)**:
  Features two new robust unit tests (`test_is_duplicate_logic` and `test_crawl_website_subpage_host_matching`) verifying duplication logic and host-based crawling.

---

## 2. Logic Chain
1. **Fix 1 Correctness**: By adding `"relation"` elements (e.g. `relation["leisure"="track"]...`) to the Overpass QL tags list and parsing their centers, the script is able to discover large tracks/parks mapped as relations. Allowing `"all"` compiles both track and offroad tag criteria into a single unified query, matching the requirement.
2. **Fix 2 Correctness**: Removing the global `self.existing_names` check from `is_duplicate` allows two distinct leads to share a name (e.g., "Speedway Park") as long as they operate in different cities/locations. Preserving domain-level uniqueness and composite `Name|Location` uniqueness prevents actual duplicates from being loaded. This is verified by the successful coexistence of SVRA parks in `leads.csv`.
3. **Fix 3 Correctness**: By utilizing the top-level domain host-based matching (`sub_host == home_host`), standard subpages such as `/contact` are easily discovered. Shared domains (e.g. `sites.google.com`) are correctly guarded using sub-path check (`startswith`) and query checks (`page_id`), keeping boundary isolation intact.
4. **Unit Tests Correctness**: The new test cases at the bottom of `test_leads.py` successfully assert these boundary behaviors without modifying the primary leads CSV.

---

## 3. Caveats
- **Slow Unit Tests**: Due to real-world rate limiting (`time.sleep(2.0, 5.0)`) inside the scraper, the crawler unit test sleeps for several seconds per run because `time.sleep` was not patched.
- **Empty Fields in Deduplication**: If leads with empty Name or Location are loaded, composite duplication will compare `"|location"` or `"name|"`. While the CSV schema guarantees these fields are not empty, adding a proactive check would be safer.

---

## 4. Conclusion
We issue a verdict of **APPROVE** with a finding of high code quality, robust design, and excellent adherence to interface contracts. All requirements are fully implemented and verified. We recommend applying minor quality improvements (such as mocking `time.sleep` and deduplicating the `KNOWN_SHARED` registry list).

---

## 5. Verification Method
To verify:
1. Run the test suite:
   ```bash
   python -m unittest test_leads.py
   ```
2. Verify that `leads.csv` remains perfectly formatted and passes all schema, category, deduplication, and URL integrity assertions.
