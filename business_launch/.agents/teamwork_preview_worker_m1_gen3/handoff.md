# Handoff Report — Lead Finder Bug Remediation

## 1. Observation
We inspected the codebase and directly observed the following three logical bugs:

- **OSM Category Mapping (Fix 1)**:
  - File: `c:\_Projects\Gridpass-v4\business_launch\find_leads.py`
  - Line 653: `if source in ["auto", "osm"] and enum_category in ["Track & Racing Circuit", "Offroad & Adventure Park"]:`
  - Lines 457 to 476: In `query_overpass()`, the tags only queried `node` and `way` elements for tracks and offroads. Large tracks and offroad parks are frequently mapped as multipolygons, which are represented as `relation` elements in OpenStreetMap.
- **Deduplication Logic (Fix 2)**:
  - File: `c:\_Projects\Gridpass-v4\business_launch\find_leads.py`
  - Lines 257 to 258: `if n_name and n_name in self.existing_names: return True`
  - File: `c:\_Projects\Gridpass-v4\business_launch\test_leads.py`
  - Lines 171 to 178:
    ```python
    # Check name duplication
    if n_name:
        self.assertNotIn(
            n_name, 
            names, 
            f"Row {idx}: Duplicate name detected: {name}"
        )
        names.add(n_name)
    ```
    This aggressive check rejects different venues/chapters that share identical or similar generic names (e.g., regional chapters in different locations), even if they have distinct locations and websites.
- **Shared Domain Crawler Subpage Crawl (Fix 3)**:
  - File: `c:\_Projects\Gridpass-v4\business_launch\find_leads.py`
  - Lines 394 to 396:
    ```python
    sub_domain = norm_domain(full_sub_url)
    if sub_domain == domain and full_sub_url not in visited_urls:
    ```
    Since `norm_domain()` preserves paths and query parameters for shared portals (such as government registries), the subpage `sub_domain` (which has a different path) would never match the homepage `domain`, completely blocking subpage discovery on shared portals.

---

## 2. Logic Chain
We resolved these issues through the following step-by-step reasoning and modifications:

- **Fix 1 (OSM Category & Query Builder)**:
  - We updated line 653 to allow `"all"` inside the condition checking `enum_category`.
  - We added `relation` elements for all track and offroad subcategories in `query_overpass()` query builder (e.g., `relation["leisure"="track"]["sport"~"motor|karting"](area.searchArea);`, `relation["highway"="raceway"](area.searchArea);`, etc.) to ensure comprehensive discovery of multipolygon-mapped tracks and parks.
- **Fix 2 (Deduplication Logic)**:
  - We removed the aggressive name check `if n_name and n_name in self.existing_names: return True` in `find_leads.py::LeadFinder.is_duplicate()`.
  - We removed the name duplication assertion from `test_leads.py::test_deduplication`. Uniqueness now strictly relies on the normalized website domain (`n_dom`) and composite name|location (`n_nameloc`), which allows different regional chapters with the same name.
- **Fix 3 (Subpage Crawler Host Match)**:
  - In `find_leads.py::LeadFinder.crawl_website()`, we parsed the `full_sub_url` using `urlparse` and extracted the lowercased host `sub_host` (stripping the leading `www.` prefix).
  - We replaced the `sub_domain == domain` comparison with `sub_host == home_host`. If they match, and `is_shared` is True, we run the path and query constraints to filter valid subpages. If they are not shared, they traverse normally. This guarantees subpages are crawled on both standard sites and shared portals.
- **Verification Tests**:
  - We added a new test class `TestLeadFinderLogic(unittest.TestCase)` in `test_leads.py` using `unittest.mock.patch` to verify `is_duplicate` logic (permitting same names in different locations) and mock `requests.Session` responses to test host-based crawl subpage discovery.

---

## 3. Caveats
- **OpenStreetMap Structure**: We assume that relations mapped in OSM have tags (e.g. `name`, `website`, `addr:city`, `addr:state`) formatted similarly to nodes and ways, and return a coordinates center via `out center;`, which standard Overpass interpreter calls guarantee.
- **Network Restrictions**: Testing of the crawler and Overpass APIs was performed through mock testing to comply with the `CODE_ONLY` network sandbox.

---

## 4. Conclusion
All three logical bugs have been successfully remediated. The codebase is clean, well-documented, follows minimal-change principles, complies with the project layout, and features robust new unit test coverage.

---

## 5. Verification Method
To verify the fixes and run the entire test suite, execute:
```powershell
python -m unittest test_leads.py
```
### Verification Files to Inspect
- `business_launch/find_leads.py`
- `business_launch/test_leads.py`
