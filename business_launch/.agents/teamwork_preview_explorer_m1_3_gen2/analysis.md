# Analysis & Proposed Fix Strategy: Duplicate Domain Normalization Bug

## Executive Summary
During the execution of the Milestone 1 test suite, the behavioral check `test_deduplication` in `test_leads.py` triggers an `AssertionError`. This occurs because both the test suite and `find_leads.py` utilize a simplified URL normalization utility `norm_domain()` that collapses all URLs to their bare base domains. For major government portals and shared parks registries (such as California State Parks/SVRAs, National Park Service, Bureau of Land Management, and state DNR directories), distinct physical venues are hosted under the same root domain differentiated only by subpaths or query parameters (e.g., `https://www.ohv.parks.ca.gov/?page_id=1178` vs `https://www.ohv.parks.ca.gov/?page_id=1179`). This collapsing triggers false-positive duplicate detections, causing the test suite to fail and programmatic crawlers to reject legitimate venues.

This report proposes a refined URL normalization scheme that dynamically identifies shared portals (or government/registry domains) to preserve path and query signatures, while retaining strict base-domain collapsing for standard websites to prevent duplicate entries.

---

## 1. Forensic Analysis of the Bug

### 1.1 Affected Code
The simplified normalization is defined in two locations:

1. **`find_leads.py`** (Lines 39-56):
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

2. **`test_leads.py`** (Lines 63-66, defined locally inside `test_deduplication`):
   ```python
   def norm_domain(url):
       if not url: return ""
       domain = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
       return domain.split('/')[0].strip()
   ```

### 1.2 Root Cause & Failure Mechanism
When parsing the central database `leads.csv`, the following distinct venue records are loaded:
- **Row 33 (Prairie City SVRA)**: `https://www.ohv.parks.ca.gov/?page_id=1178`
- **Row 34 (Hollister Hills SVRA)**: `https://www.ohv.parks.ca.gov/?page_id=1179`
- **Row 37 (Hungry Valley SVRA)**: `https://www.ohv.parks.ca.gov/?page_id=1184`

Under the simplified normalization scheme, all three of these URLs resolve to the exact same normalized key:
$$\text{ohv.parks.ca.gov}$$

As a result:
1. In `test_leads.py`, the test suite populates a set of encountered normalized domains. Upon encountering Row 34, it discovers `ohv.parks.ca.gov` is already present, triggering the strict assertion failure:
   `AssertionError: Row 34: Duplicate website domain detected: https://www.ohv.parks.ca.gov/?page_id=1179 (normalized: ohv.parks.ca.gov)`
2. In `find_leads.py`, any attempt to programmatically import or search for Hollister Hills SVRA or Hungry Valley SVRA fails because the deduplication check `is_duplicate` flags them as duplicates of Prairie City SVRA and skips them.

---

## 2. Refined URL Normalization & De-duplication Strategy

To resolve the bug without compromising deduplication integrity for ordinary businesses, we propose a **hybrid URL normalization scheme**.

### 2.1 The Concept: Domain-Aware Context Preservation
1. **Standard Domains** (e.g., `sonomaraceway.com`): Standard business URLs are normalized directly to their bare base domains. This ensures that slight variations like subpages (e.g. `/contact` or `/about`) or query parameters still collapse to the root domain, correctly identifying duplicates.
2. **Shared Portals / Government Registries** (e.g., `.gov` sites, multi-venue directories): When a domain is recognized as a shared portal, the normalization routine preserves the host, subpath, and any significant query parameters (like `page_id`). This ensures distinct venues hosted on a shared domain maintain unique normalized signatures.

### 2.2 Identification of Shared Portals
Shared portals can be identified via two robust mechanisms:
1. **Explicit Domain Whitelist**: High-frequency multi-venue platforms (such as state parks directories, link trees, and shared GIS portals).
2. **TLD/Suffix Checks**: Any domain ending with `.gov` (government), `.fed.us` (federal), `.state.us` (state registries), or other well-known public sector suffixes.

*Target list of known shared portals in current database:*
- `parks.ca.gov`
- `ohv.parks.ca.gov`
- `nps.gov`
- `blm.gov`
- `stateparks.utah.gov`
- `dnr.state.mn.us`
- `in.gov`
- `cityofbridgeport.net`
- `fs.usda.gov`
- `recreation.gov`
- `linktr.ee`
- `github.io`
- `sites.google.com`

---

## 3. Proposed Refined Code Implementation

### 3.1 Proposed `norm_domain(url)` Implementation
The following implementation uses the standard `urllib.parse` library to extract URL parts cleanly, sort query arguments (making normalization order-independent), discard tracking parameters (like `utm_source`), and safely handle trailing slashes:

```python
import urllib.parse

def norm_domain(url):
    """Normalize a website URL for deduplication.
    
    For standard domains, collapses to the bare base domain.
    For shared portals (e.g. government directories, parks lists), 
    preserves the path and query signature to keep venues distinct.
    """
    if not url:
        return ""
    
    url_lower = url.lower().strip()
    
    # Standardize protocol prefixes
    if url_lower.startswith("https://"):
        url_clean = url_lower[8:]
    elif url_lower.startswith("http://"):
        url_clean = url_lower[7:]
    else:
        url_clean = url_lower
        
    # Standardize www. subdomains
    if url_clean.startswith("www."):
        url_clean = url_clean[4:]
        
    # Split into domain host and remaining URI portion
    parts = url_clean.split('/', 1)
    domain = parts[0].strip()
    rest = parts[1] if len(parts) > 1 else ""
    
    # Strip any trailing fragment identifier
    rest = rest.split('#')[0].strip()
    
    # Check if the domain is a known shared registry or a government site
    known_shared = {
        "parks.ca.gov",
        "ohv.parks.ca.gov",
        "nps.gov",
        "blm.gov",
        "stateparks.utah.gov",
        "dnr.state.mn.us",
        "in.gov",
        "cityofbridgeport.net",
        "fs.usda.gov",
        "recreation.gov",
        "linktr.ee",
        "github.io",
        "sites.google.com"
    }
    
    is_shared = (
        domain in known_shared or 
        domain.endswith(".gov") or 
        domain.endswith(".fed.us") or 
        domain.endswith(".state.us")
    )
    
    if not is_shared:
        # Standard Domain: collapse completely to the bare base domain
        return domain
    else:
        # Shared Portal: preserve the domain, path, and normalized query parameters
        path_query = rest.split('?', 1)
        path = path_query[0].rstrip('/')
        query_str = path_query[1] if len(path_query) > 1 else ""
        
        # Parse query parameters and strip marketing/tracking junk parameters
        query_params = urllib.parse.parse_qsl(query_str)
        filtered_params = sorted([
            (k, v) for k, v in query_params 
            if k not in {'utm_source', 'utm_medium', 'utm_campaign', 'ref', 'gclid', 'fbclid'}
        ])
        
        normalized = domain
        if path:
            normalized += "/" + path
        if filtered_params:
            normalized += "?" + urllib.parse.urlencode(filtered_params)
            
        return normalized
```

### 3.2 Integrity of Key Deduplication
To keep deduplication robust and ensure actual duplicate entries are caught, the `is_duplicate` check should continue to combine:
1. **Normalized Domain / URL Signature**: Ensures different pages on the same standard business are caught, while distinct venues on shared portals are kept.
2. **Normalized Name**: Catch-all for matching names (e.g. case and space-insensitive matching).
3. **Normalized Name + Location**: Catch-all for checking specific location-bound venues where a slightly different domain/email might be used but name and location match.

---

## 4. Verification and Implementation Plan

### 4.1 Implementation Steps
1. **Update `find_leads.py`**:
   Replace the original definition of `norm_domain()` on lines 39–56 with the refined implementation shown in Section 3.1.
2. **Update `test_leads.py`**:
   Replace the local definition of `norm_domain()` inside `test_deduplication` (lines 63–66) with the refined implementation.

### 4.2 Verification Steps
To verify that this solution solves the integrity violation:
1. Run the test suite:
   ```bash
   python -m unittest test_leads.py
   ```
2. **Verification Condition**:
   - The test `test_deduplication` must pass without throwing any assertions.
   - All 50+ existing leads inside `leads.csv` must be fully validated.
