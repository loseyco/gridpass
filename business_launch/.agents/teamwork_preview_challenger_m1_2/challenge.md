# Adversarial Challenge Report: Milestone 1 Verification

**Date**: 2026-05-22  
**Verification Result**: **FAIL** (Due to pre-existing deduplication violations in `leads.csv`)

---

## Challenge Summary

**Overall risk assessment**: **HIGH**  
While the utility scripts exhibit clean syntax and robust exception handling for external network failures, the primary deliverable database (`leads.csv`) contains serious deduplication violations that cause the test suite (`test_leads.py`) to fail out of the box. Additionally, structural flaws in the crawling and multi-category querying logic introduce high risk of data contamination.

---

## Challenges

### [Critical] Challenge 1: Database Test Suite Failure Due to Shared Domains in `leads.csv`
- **Assumption challenged**: The test suite assumes that every venue has a unique base domain and that base domain deduplication is a valid integrity rule.
- **Attack scenario**: Row 33 (`Prairie City SVRA`), Row 34 (`Hollister Hills SVRA`), and Row 37 (`Hungry Valley SVRA`) are all separate California State Recreation Areas but share the same base domain:
  - Row 33 Website: `https://www.ohv.parks.ca.gov/?page_id=1178`
  - Row 34 Website: `https://www.ohv.parks.ca.gov/?page_id=1179`
  - Row 37 Website: `https://www.ohv.parks.ca.gov/?page_id=1184`
  
  When `test_leads.py` executes, `norm_domain()` normalizes all three of these URLs to `ohv.parks.ca.gov`. The deduplication test assertions raise an `AssertionError` on Row 34 (line 35 of the file):
  `AssertionError: Row 35: Duplicate website domain detected: https://www.ohv.parks.ca.gov/?page_id=1179 (normalized: ohv.parks.ca.gov)`
- **Blast radius**: The test suite fails out of the box, breaking CI/CD pipelines and violating the Milestone 1 deliverable criteria.
- **Mitigation**: Update the definition of `norm_domain()` to preserve paths/queries for multi-tenant or shared hosting domains (e.g., `.gov` or `.org` domains with page parameters), or update the test suite to allow duplicates for specific government/shared platforms.

### [High] Challenge 2: Crawler Subpage Contamination on Shared Domains
- **Assumption challenged**: The crawler assumes that any hyperlink sharing the base domain of the homepage is a safe subpage to scrape for that specific venue's contacts.
- **Attack scenario**: When crawling a site hosted on a shared platform (e.g., `https://www.stateparks.utah.gov/parks/sand-hollow`), the crawler normalizes the base domain to `stateparks.utah.gov`. It will follow and scrape any link matching `stateparks.utah.gov`, such as `https://www.stateparks.utah.gov/parks/another-park/contact`, thus scraping unrelated contact info.
- **Blast radius**: Mismatched and incorrect contact emails/phones inside the database for venues sharing a host.
- **Mitigation**: Refine the crawler's URL matching logic to verify that subpages start with the full URL path prefix of the parent homepage, rather than just matching the base domain.

### [Medium] Challenge 3: Incomplete Search engine Fallback under `--category all` CLI Filter
- **Assumption challenged**: Setting `--category all` should search across all three business segments (tracks, offroad parks, and car clubs).
- **Attack scenario**: When `--category all` is used, `map_category_to_enum()` maps `"all"` to the default value `"Track & Racing Circuit"`. While Overpass QL is configured to search both tracks and offroad parks, the subsequent DuckDuckGo and Google fallbacks only query for tracks (`"race track motor speedway..."`) and forcibly categorize all retrieved websites under `"Track & Racing Circuit"`.
- **Blast radius**: Secondary fallback searches will completely miss car clubs and offroad parks under the `"all"` filter, and any discovered candidates will be miscategorized.
- **Mitigation**: Update the fallback search generation and classification logic to execute multi-category search terms when the category is set to `"all"`.

### [Medium] Challenge 4: Lack of Concurrency Protection
- **Assumption challenged**: The lead finder assumes a single-threaded, non-concurrent execution environment.
- **Attack scenario**: If multiple ingestion pipelines or cron jobs run `find_leads.py` concurrently, they will read the file state at the same time, check duplication in isolation, and write duplicates back to the file simultaneously.
- **Blast radius**: Race conditions leading to duplicate database records and file-lock corruption.
- **Mitigation**: Implement standard file locking (e.g., using `portalocker` or a custom lock-file protocol) on `leads.csv` during reads and writes.

---

## Stress Test Results

| Test Scenario | Prototyped Input | Expected Behavior | Actual/Predicted Behavior | Status |
|---|---|---|---|---|
| **Syntax Compilation Check** | `python -m py_compile find_leads.py test_leads.py` | Both files compile without error | Clean compilation, zero syntax issues | **PASS** |
| **Database Suite Execution** | `python test_leads.py` | Complete pass of all integrity checks | Fails on Row 34 (Duplicate domain `ohv.parks.ca.gov`) | **FAIL** |
| **CLI Empty Parameters** | `--state "" --city "" --zip ""` | Fallback to entire US area | Defaults to `area["ISO3166-1"="US"]`, no crash | **PASS** |
| **CLI Invalid Categories** | `--category invalid` | Clean argument error message | Intercepted by `argparse` choices, clean exit | **PASS** |
| **CLI Negative/Zero Limits** | `--limit -5` or `--limit 0` | Stop execution before loop starts | Immediate graceful loop breakout, no crash | **PASS** |
| **CLI Non-existent Directory** | `--output invalid_dir/leads.csv` | File IO exception handling | Clean exit: caught, printed, and no traceback | **PASS** |
| **Manual Duplication Test** | Append duplicate name/website | De-duplication skips double insertion | strict deduplication prevents insertion | **PASS** |
| **Offline Execution** | Disconnected network | Crawlers fail silently, exit cleanly | Exceptions caught; exits with 0 appends | **PASS** |

---

## Unchallenged Areas

- **BeautifulSoup Parsing Selectors**: Not challenged extensively. We assume the HTML structure of crawled sites is highly variable and that BeautifulSoup selectors are resilient.
- **OSM Overpass Timeout / Gateway Failures**: We did not stress test Overpass rate limits (which could block IP addresses), as we are limited to static analysis.
