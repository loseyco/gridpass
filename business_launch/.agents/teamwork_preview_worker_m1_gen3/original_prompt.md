## 2026-05-22T15:09:50Z

You are Worker Gen 3.
Your working directory is: c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m1_gen3.
Your parent is: e129e894-5d40-4306-964a-3f2a3e904a05 (the orchestrator).

Your task is to remediate three critical logical bugs in find_leads.py and test_leads.py:

1. Fix 1: OSM Category Mapping Bug
   - Update line 653 (or surrounding match) in `find_leads.py` to allow "all" inside the Overpass condition:
     `if source in ["auto", "osm"] and enum_category in ["Track & Racing Circuit", "Offroad & Adventure Park", "all"]:`
   - Update the `query_overpass()` query builder in `find_leads.py` to query `relation` elements (racetracks and parks mapped as multipolygons) in addition to `node` and `way` elements across categories. Add relation elements for all track and offroad subcategories.

2. Fix 2: Deduplication Logic Bug
   - In `find_leads.py::LeadFinder.is_duplicate()`, remove the hyper-aggressive name deduplication:
     `if n_name and n_name in self.existing_names: return True`
     Uniqueness must strictly rely on normalized domain (`n_dom`) and composite name|location (`n_nameloc`) to allow venues with generic/same names in different geographical regions (e.g., regional chapters).
   - In `test_leads.py::test_deduplication`, remove the `Check name duplication` assertion so it matches this logic and prevents crashing on regional chapters with similar names.

3. Fix 3: Shared Domain Crawler Subpage Crawl Bug
   - In `find_leads.py::LeadFinder.crawl_website()`, avoid comparing `sub_domain == domain` in subpage discovery where `sub_domain` contains paths and query strings.
   - Instead, compare the actual hosts: `sub_host == home_host` (base hostname string matching) to verify they share the same host. Ensure that `sub_host` is extracted using parsed URL's `netloc.lower()` and stripping any leading `www.` prefix (similar to how `home_host` is extracted).
   - If they match, and `is_shared` is True, then execute the path constraints and query constraints to filter valid venue pages.

Acceptance Criteria:
- Implement all three fixes in `find_leads.py` and `test_leads.py`.
- Run the build/test suite using `python -m unittest test_leads.py` to verify that all unit tests pass 100%.
- Maintain your own `progress.md` at your working directory (`c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m1_gen3\progress.md`) and write a detailed `handoff.md` at your working directory (`c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m1_gen3\handoff.md`) when complete.
- Verify that your output matches the code layout defined in `PROJECT.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
