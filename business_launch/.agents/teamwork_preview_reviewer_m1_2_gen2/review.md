# Milestone 1 Code Review & Stress-Test Report

**Verdict**: **PASS (with Major Recommendations)**

This report covers the comprehensive review and adversarial challenge of the Milestone 1 implementation for the **gridpass.app** Business Outreach & Growth Launch, specifically analyzing `find_leads.py`, `test_leads.py`, and `leads.csv`.

---

## 1. Quality Review (Objective Assessment)

### 1.1 Correctness & Feature Coverage
- **URL Normalization (`norm_domain`)**:
  - Successfully implements a hybrid collapsing system.
  - Standard domains (e.g., `sonomaraceway.com`) collapse to bare base domains.
  - Shared registries (e.g., `parks.ca.gov`, `nps.gov`, `linktr.ee`, `sites.google.com`) preserve path and normalized query parameters (filtering tracking/marketing junk parameters like `utm_source`, `gclid`).
- **CLI Category Mapping**:
  - Command-line arguments `--category` map correctly to unified category enums via `map_category_to_enum` (e.g. "track" -> "Track & Racing Circuit").
  - Falls back sequentially through categories when `--category all` is invoked.
- **Crawler Subpage Constraints**:
  - Implements subpage path-nesting checks and query parameter matching (e.g. `page_id`, `id`, `parkid`, `venue`) to avoid crossing venue boundaries on shared portals.
- **Lead Database (`leads.csv`)**:
  - Contains exactly **52 validated leads**, meeting the 50+ lead threshold.
  - Columns strictly match the interface contract: `Name, Category, Location, Website, Email, Phone, Instagram, Facebook`.
  - All columns are fully populated for all 52 leads.

### 1.2 Code Quality & Style
- **Python Conventions**:
  - Clean separation of concerns with a modular `LeadFinder` class.
  - Excellent use of regex fallbacks and robust HTML scraping parser (`BeautifulSoup`).
  - Standardized user-agents and polite crawling delays (`time.sleep(random.uniform(2.0, 5.0))`).
- **Unit Tests (`test_leads.py`)**:
  - Extremely thorough unit test suite validating: file existence, schema, required fields, categories, deduplication (via domain, name, and name|location combinations), and URL formats.
  - **Minor Issue**: `norm_domain` has a duplicate implementation hardcoded inside `test_leads.py` (lines 63-142). It should instead be imported from `find_leads.py` to maintain a single source of truth.

---

## 2. Adversarial Review (Critic & Stress-Testing)

### 2.1 Design Flaw: Category Quota Starvation
- **Mechanism**: Under `--category all` with `--limit N` (e.g., default `10`), the fallback loop sequentially iterates over subcategories:
  ```python
  subcategories = ["track", "offroad", "car_club"] if enum_category == "all" else [category]
  for sub_cat in subcategories:
      if len(candidates) >= limit:
          break
  ```
- **Vulnerability**: If the first category (`track`) retrieves $N$ or more candidates, the loop breaks instantly, completely starving the `offroad` and `car_club` categories. 
- **Blast Radius**: The user receives a highly skewed lead database skewed only towards the first subcategory.
- **Mitigation**: Instead of breaking on total size in a sequential loop, divide the limit evenly among the subcategories (e.g. `limit // len(subcategories)`) or query all and then do a round-robin merge before slicing to the limit.

### 2.2 Shared Portal Domain Omissions
- **Mechanism**: The `known_shared` list in both `find_leads.py` and `test_leads.py` contains 13 hardcoded domains.
- **Vulnerability**: Popular platforms where car clubs or tracks host pages under common subdirectories (e.g., `meetup.com/club-name`, `eventbrite.com/o/org-name`, `facebook.com/group-name`) are not included in the shared domains list.
- **Blast Radius**: If two separate leads use `meetup.com` as their primary site, they will normalize to `meetup.com`. The deduplication check will flag the second lead as a duplicate of the first, skipping it entirely!
- **Mitigation**: Expand the `known_shared` set to include common social and community hosting platforms like `meetup.com`, `eventbrite.com`, `linktr.ee`, etc., or use path-sensitive deduplication for major platforms.

### 2.3 Crawler Path Check False Negatives
- **Mechanism**: The crawler uses `norm_sub_path.startswith(norm_home_path)` to ensure nested crawling.
- **Vulnerability**: If a shared portal has its contact form at `/contact` or `/about` (un-nested relative to the venue page `/parks/detail?id=123`), the path check fails because `/contact` does not start with `/parks/detail`.
- **Blast Radius**: The crawler misses valid contact info for portals that use a centralized directory mapping but store actual contact pages at separate base paths.
- **Mitigation**: If query parameters match, allow central `/contact` paths, or fall back to home-domain contact forms when nested paths don't yield results.

---

## 3. Verified Claims

1. **50+ Validated Leads** $\rightarrow$ Verified $\rightarrow$ **PASS**
   - Verified that `leads.csv` has exactly 52 records with zero duplicate names/websites and 100% complete data fields.
2. **Schema Integrity** $\rightarrow$ Verified $\rightarrow$ **PASS**
   - Headers match the spec: `Name,Category,Location,Website,Email,Phone,Instagram,Facebook`.
3. **URL Normalization Hybrid Base-Domain / Shared Portal** $\rightarrow$ Verified $\rightarrow$ **PASS**
   - `leads.csv` contains multiple shared government links (e.g. `ohv.parks.ca.gov/?page_id=1178` and `ohv.parks.ca.gov/?page_id=1179`) which are correctly preserved and not deduplicated.

---

## 4. Key Findings

### [Major] Category Quota Starvation in CLI Fallback Loop
- **Where**: `find_leads.py` (lines 678 and 704)
- **Why**: Sequential iteration with an early break on `limit` starves later categories when the first category is highly active.
- **Suggestion**: Use round-robin collection or divide the requested `limit` among the active subcategories.

### [Major] Duplicated Normalization Code
- **Where**: `test_leads.py` (lines 63-142) vs `find_leads.py` (lines 39-118)
- **Why**: Maintaining two identical, 80-line blocks of complex normalization logic increases the risk of drift if one is modified and the other isn't.
- **Suggestion**: Import `norm_domain` and `norm_name` directly from `find_leads.py` inside `test_leads.py`.

### [Minor] Shared Portal Domain Omissions
- **Where**: `find_leads.py` (lines 72-86)
- **Why**: Standardizing domains like `meetup.com` to the base domain without paths will result in false duplicate detections.
- **Suggestion**: Add `meetup.com`, `eventbrite.com`, and similar hosts to the `known_shared` set.
