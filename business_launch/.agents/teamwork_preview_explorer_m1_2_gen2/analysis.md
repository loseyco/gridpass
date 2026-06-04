# Milestone 1: Duplicate Domain Normalization Fix Strategy

## Executive Summary
During validation of the Milestone 1 leads database and programmatic scraper tool, a core duplicate domain normalization bug was discovered. The simplified `norm_domain()` utility strips all query arguments and paths, collapsing distinct physical venues that share large web portals (primarily municipal and government domains like California State Parks/OHV `ohv.parks.ca.gov`) into a single base domain. 

This causes two primary failures:
1. **Behavioral Scraper Failure**: The programmatic scraper (`find_leads.py`) skips parsing and appending legitimate, distinct venues (such as separate SVRAs) because it falsely flags them as duplicates.
2. **Test Suite Integrity Failure**: The automated test suite (`test_leads.py::test_deduplication`) raises a strict `AssertionError` when checking `leads.csv`, specifically at row 34 (`Hollister Hills SVRA` sharing `ohv.parks.ca.gov` with `Prairie City SVRA`), causing verification to fail.

This document presents a comprehensive analysis of the bug and proposes a robust, low-risk, and backwards-compatible fix strategy that aligns the domain normalization logic between the scraper and the test suite, preserving query and path signatures for shared portals while keeping standard domains strictly deduplicated.

---

## 1. Problem Definition & Boundary Analysis

### 1.1 The Vulnerability Location
The duplicate detection mechanism is defined in two separate places within the codebase:
- **`find_leads.py`** (Lines 39-56): Used by the crawling and appending script.
- **`test_leads.py`** (Lines 63-66): Locally hardcoded inside the `test_deduplication` unit test.

### 1.2 The Faulty Implementations
**In `find_leads.py`:**
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

**In `test_leads.py` (Local Function):**
```python
        def norm_domain(url):
            if not url: return ""
            domain = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
            return domain.split('/')[0].strip()
```

### 1.3 Collision Analysis
When processing the following entries in `leads.csv`, both implementations strip query strings and subpaths, collapsing them to `ohv.parks.ca.gov`:

| Row | Venue Name | Website URL | Collapsed Domain (`norm_domain`) |
|---|---|---|---|
| **33** | Prairie City SVRA | `https://www.ohv.parks.ca.gov/?page_id=1178` | `ohv.parks.ca.gov` |
| **34** | Hollister Hills SVRA | `https://www.ohv.parks.ca.gov/?page_id=1179` | `ohv.parks.ca.gov` |
| **37** | Hungry Valley SVRA | `https://www.ohv.parks.ca.gov/?page_id=1184` | `ohv.parks.ca.gov` |

When `test_leads.py` validates the database:
1. Row 33 is processed, and `ohv.parks.ca.gov` is added to the `domains` tracking set.
2. Row 34 is processed, and `norm_domain("https://www.ohv.parks.ca.gov/?page_id=1179")` evaluates to `ohv.parks.ca.gov`.
3. The assertion `self.assertNotIn(n_dom, domains, ...)` fails immediately with:
   `AssertionError: Row 34: Duplicate website domain detected: https://www.ohv.parks.ca.gov/?page_id=1179 (normalized: ohv.parks.ca.gov)`

Similarly, in `find_leads.py`, once any lead from `ohv.parks.ca.gov` exists in the database, `is_duplicate()` will return `True` for any other SVRA using the same domain, preventing the scraper from adding them.

---

## 2. Proposed Refined URL Normalization Strategy

To resolve the duplicate domain normalization bug while maintaining a robust, leak-proof deduplication schema, we recommend a **Shared Portal Filter Pattern**.

### 2.1 The Core Logic
We classify domains into two categories:
1. **Shared Portals (Multi-venue Domains)**: Public agencies, municipal governments, and park systems (e.g., `.gov`, `.us`, `.net` city portals) that use a single host domain with subpaths or query parameters to represent completely separate physical and business entities. For these, we **preserve the subpath and query parameters** to maintain uniqueness.
2. **Standard Standalone Domains**: Single-venue websites (e.g., `sonomaraceway.com`, `limerock.com`). For these, we **truncate to the base domain** to guarantee that duplicates using different subpaths (e.g., `/events`, `/tickets`) are caught.

### 2.2 Python Implementation Details

We propose implementing the following helper and refined normalization function:

```python
def is_shared_portal(domain):
    """Determine if a domain is a shared portal containing multiple distinct venues."""
    # Group A: Universal government and state portals (.gov, federal agencies)
    if domain.endswith(".gov") or ".gov." in domain:
        return True
        
    # Group B: Explicitly identified state-level, federal, or municipal portals
    shared_domains = [
        "parks.ca.gov",
        "ohv.parks.ca.gov",
        "stateparks.utah.gov",
        "dnr.state.mn.us",
        "cityofbridgeport.net",
        "state.co.us",
        "state.tx.us",
        "usda.gov",
        "fs.usda.gov"
    ]
    return any(domain.endswith(d) for d in shared_domains)

def norm_domain(url):
    """Normalize a website URL for de-duplication, preserving paths/queries for shared portals."""
    if not url:
        return ""
    
    url_lower = url.lower()
    
    # Strip protocol (http/https)
    if url_lower.startswith("https://"):
        domain = url_lower[8:]
    elif url_lower.startswith("http://"):
        domain = url_lower[7:]
    else:
        domain = url_lower
        
    # Strip www. subdomain
    if domain.startswith("www."):
        domain = domain[4:]
        
    # Strip anchors/hashes (client-side routing tags)
    domain = domain.split('#')[0].strip()
    
    # Extract hostname to verify if it represents a shared portal
    host = domain.split('/')[0].split('?')[0].strip()
    
    if is_shared_portal(host):
        # Preserve path and query parameters for shared portals, stripping trailing slash
        return domain.rstrip('/')
    
    # Standalone domain: truncate strictly to base hostname
    return host
```

---

## 3. Implementation Plan

To apply this fix without direct source modification (preserving the Read-only exploration agent constraints), an implementer should execute the following steps:

### Step 1: Align Scraper (`find_leads.py`)
Replace the existing global `norm_domain()` (Lines 39-56) with the refined version and define the helper `is_shared_portal()`.

### Step 2: Align Unit Tests (`test_leads.py`)
Update the nested `norm_domain()` definition inside `test_deduplication()` (Lines 63-66) to match the new behavior exactly, ensuring the test suite uses the same deduplication logic.

### Step 3: Verify the leads database
Since the existing `leads.csv` has valid, non-duplicate query strings for CA SVRAs (page IDs `1178`, `1179`, `1184`), the tests will immediately pass once the domain normalization logic is updated.

---

## 4. Alternate Strategies Considered

### Alternate A: Strict Canonical URL Comparison For All Domains
- **Mechanism**: Compare full URLs directly (case-insensitive, ignoring protocol and `www.`).
- **Trade-off**: High risk of duplicate leakage. For example, `https://www.willowspringsraceway.com` and `https://willowspringsraceway.com/tickets` would be treated as separate domains, allowing duplicate leads. Thus, this option was rejected.

### Alternate B: Eliminate Domain Checking in Favor of Name+Location
- **Mechanism**: De-duplicate solely on `normalized(Name)` and `normalized(Name) + normalized(Location)`.
- **Trade-off**: Standard domain checking is a highly reliable secondary safeguard when crawler title parsing yields slightly different names (e.g. "Willow Springs Raceway" vs "Willow Springs International Raceway"). Removing it completely lowers deduplication safety.

---

## 5. Verification Plan

An independent developer or agent can verify this fix strategy using the following checklist:

1. **Verify Unit Test Suite**: Run `python test_leads.py`.
   - **Before Fix**: Test fails with `AssertionError: Row 34: Duplicate website domain detected...`
   - **After Fix**: Test passes successfully.
2. **Verify Scraper Duplication Check**:
   - Run the lead finder targeting California tracks or parks:
     `python find_leads.py --state CA --category offroad --limit 5`
   - Observe that the script successfully identifies and does not skip distinct SVRAs or state parks when executing crawling or database-appending.
