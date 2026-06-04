# Empirical Challenge Report — Milestone 1 Deliverables Review

**Overall risk assessment**: MEDIUM

Gridpass-v4 Business Launch - Milestone 1 validation: `leads.csv`, `find_leads.py`, and `test_leads.py`.

## PASS/FAIL Verdict

**VERDICT: PASS (With Caveats)**
The deliverables meet all primary criteria outlined in `PROJECT.md` (database containing 52 validated, unique leads in a clean CSV layout with expected headers, working CLI lead acquisition automation script, and complete unit test coverage that passes 100% cleanly). However, deep adversarial code path auditing has revealed critical design flaws, logic bugs, and dead-code blocks in `find_leads.py` that restrict search coverage, limit crawling on shared portals, and create over-aggressive deduplication constraints.

---

## Challenges

### [High] Challenge 1: Unreachable Website Crawling Subpages for Shared Portals
- **Assumption challenged**: The crawler correctly parses subpages for both standard domains and shared registries (e.g., government sites like `.gov`, `parks.ca.gov`, `linktr.ee`, `blm.gov`).
- **Attack scenario**: When a lead is a shared portal, the `norm_domain(url)` function includes the path and query parameters in the normalized domain. For example, for Sand Hollow State Park, the normalized domain is `"stateparks.utah.gov/parks/sand-hollow"`. When scanning for subpages (e.g., a contact subpage at `https://www.stateparks.utah.gov/parks/sand-hollow/contact/`), its `sub_domain` becomes `"stateparks.utah.gov/parks/sand-hollow/contact"`. 
- **Blast radius**: The subpage-matching check `if sub_domain == domain` evaluates to `False`. Thus, the subpage is completely discarded *before* the inner `is_shared` validation logic can execute. 
- **Mitigation**: The domain-matching logic in the subpage discovery loop must be adjusted for shared portals to check if `sub_domain.startswith(domain)` or separate the host domain check from path-prefix validation.

### [Medium] Challenge 2: Over-aggressive Deduplication of Unique Venues (Dead Code Check)
- **Assumption challenged**: The deduplication logic handles primary key checks (domain) and secondary fallback checks (Name + Location combination) to allow duplicate names in different locations.
- **Attack scenario**: The name check `if n_name and n_name in self.existing_names: return True` is evaluated *before* the name-location check. If two separate venues share a name (e.g. "Cars & Coffee" in Austin, TX vs "Cars & Coffee" in Los Angeles, CA), they both normalize to `"carscoffee"`. 
- **Blast radius**: The name-only check will trigger and return `True`, discarding the second venue completely, even though its website and location are unique. Furthermore, the `if n_nameloc in self.existing_name_locs: return True` check is 100% dead code and unreachable.
- **Mitigation**: Eliminate the name-only check from the duplicate detection pipeline, and rely purely on normalized domain and Name|Location combination.

### [Medium] Challenge 3: Overpass API Skipped and Sequential Category Bias for `--category all` Queries
- **Assumption challenged**: Running with `--category all` queries all categories via all sources and balances the outputs.
- **Attack scenario**: 
  1. In `find_leads()`, the Overpass API query is guarded by `if source in ["auto", "osm"] and enum_category in ["Track & Racing Circuit", "Offroad & Adventure Park"]`. Since `enum_category` is `"all"`, this guard evaluates to `False`, skipping the Overpass API query entirely!
  2. For the fallback search engines, the loop over subcategories (`"track"`, `"offroad"`, `"car_club"`) breaks early as soon as `len(candidates) >= limit`.
- **Blast radius**: The tool gets zero high-quality leads from the Overpass API when `--category all` is requested, and the results from search engine fallbacks will be 100% biased towards tracks (the first subcategory), completely omitting offroad and car club leads once the limit is satisfied.
- **Mitigation**: Adjust the `enum_category` check to allow Overpass search when the category is `"all"`, and query categories in a round-robin or interleaved manner rather than sequentially breaking early.

---

## Stress Test Results

- **Run `--limit 1`** → Limit enforced successfully. -> **PASS**
- **Run `--category all`** → Skips Overpass API completely, sequential early exit limits diversity. -> **FAIL (Quality / Coverage Gap)**
- **De-duplication of existing database** → Successfully skips existing leads but blocks new, unique venues sharing a name in different locations. -> **PASS (Mechanism works) / FAIL (Over-aggressive criteria)**

## Unchallenged Areas

- **BeautifulSoup and requests implementation** — The user agents and request compliance pauses are well-implemented and minimize rate-limiting risk.
- **CSV Format Compliance** — Perfectly structured schema.
