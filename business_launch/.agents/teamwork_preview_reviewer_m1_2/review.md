# Milestone 1 Review Report

**Verdict**: FAIL / REQUEST_CHANGES

## Review Summary

We have reviewed the implementation of Milestone 1 of the gridpass.app Business, Outreach & Growth Launch. The implementation includes a robust programmatic lead finder utility (`find_leads.py`), a test suite (`test_leads.py`), and a lead database with 52 validated entries (`leads.csv`).

While the scraping logic is highly sophisticated and robust, a critical design issue in the URL/domain deduplication logic causes the test suite `test_leads.py` to **fail** and prevents the programmatic acquisition of distinct state-managed or multi-venue leads (e.g., California State Vehicular Recreation Areas) that share a base domain but have different pages/query parameters.

---

## Findings

### [Critical] Finding 1: Duplicate Domain Assertion Failure in Test Suite

- **What**: The test suite fails because `test_deduplication` aggressively treats different pages on the same base domain as duplicates and asserts that they are not allowed.
- **Where**: `test_leads.py` (lines 61-112), and `leads.csv` (Rows 33, 34, and 37).
- **Why**: 
  - Row 33 is `Prairie City SVRA` with website `https://www.ohv.parks.ca.gov/?page_id=1178`.
  - Row 34 is `Hollister Hills SVRA` with website `https://www.ohv.parks.ca.gov/?page_id=1179`.
  - Row 37 is `Hungry Valley SVRA` with website `https://www.ohv.parks.ca.gov/?page_id=1184`.
  - The `norm_domain` function in `test_leads.py` strips query parameters and paths:
    ```python
    def norm_domain(url):
        if not url: return ""
        domain = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
        return domain.split('/')[0].strip()
    ```
    This normalizes all three URLs to `ohv.parks.ca.gov`.
  - When the test suite processes Row 34, it sees `ohv.parks.ca.gov` already in the `domains` set and triggers an assertion failure:
    `Row 34: Duplicate website domain detected: https://www.ohv.parks.ca.gov/?page_id=1179 (normalized: ohv.parks.ca.gov)`
- **Suggestion**: 
  - Modify `norm_domain` in both `find_leads.py` and `test_leads.py` to preserve path or query parameter signatures for large government portals or domain roots that host distinct venues (e.g., checking if the domain is a known government domain like `gov`, or simply keeping the path/query parameters if they specify distinct pages/IDs).
  - Alternatively, relax the duplicate check to use `Name` and `Name|Location` as primary constraints, and only treat URLs as duplicates if they resolve to the exact same full URL (or base URL with path, rather than stripping down to the root domain).

### [Major] Finding 2: Over-aggressive Deduplication in Lead Ingestion Script

- **What**: `find_leads.py` uses the same aggressive `norm_domain` logic, which prevents programmatic crawling and ingestion of other California State Parks (SVRA) or similar portal-based venues.
- **Where**: `find_leads.py` (lines 39-56, `norm_domain` and lines 186-198, `is_duplicate`).
- **Why**: Any attempt to add another SVRA track using `find_leads.py` will be skipped as a duplicate because `is_duplicate` checks `n_dom in self.existing_domains`, which will be true once the first `ohv.parks.ca.gov` page is added.
- **Suggestion**: Align `find_leads.py`'s deduplication logic with the suggested fix for Finding 1.

---

## Verified Claims

- **Header Naming & Schema** → verified via manual code inspection of `leads.csv` header and `test_leads.py` required headers → **PASS**
  - Headers are: `Name,Category,Location,Website,Email,Phone,Instagram,Facebook` (exactly matches the contract).
- **Lead Database Count** → verified via counting entries in `leads.csv` → **PASS**
  - There are 52 validated entries (Rows 2 to 53), which meets the milestone requirement of 50+ leads.
- **Scraping Robustness (De-duplication & Fallbacks)** → verified via static review of `find_leads.py` → **PASS (with caveats)**
  - De-duplication has the domain issue detailed above but successfully guards against duplicates using normalized Name and Name|Location.
  - Fallbacks are robust: uses Overpass API for primary venue query, falls back to Google CSE or DuckDuckGo HTML non-JS searches.
  - Crawler extracts emails, phone numbers, and socials with high-quality validation regexes.

---

## Coverage Gaps

- **Running Tests in Terminal** — risk level: Low — recommendation: Accept Risk
  - Attempting to run `python test_leads.py` failed due to terminal permission timeout. However, the logic path is clear, well-structured, and the assertion failure on `leads.csv`'s duplicate domains is mathematically guaranteed.

---

## Unverified Items

- **Actual Crawler Run Outcomes** — The scraper's physical web scraping capability under real network requests is unverified in this local dry-run (CODE_ONLY network mode). However, the static structure matches standard robust scraping patterns (use of headers, random user agents, request delays of 2-5s, session pooling, and BeautifulSoup element extraction).
