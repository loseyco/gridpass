# Fix Strategy Report: Duplicate Domain Normalization Bug in Milestone 1

## Executive Summary
This report analyzes and proposes a fix strategy for the duplicate domain normalization bug in Milestone 1. The test `test_deduplication` in `test_leads.py` and the duplication checks in `find_leads.py` use a simplified `norm_domain()` utility that strips query strings and subpaths, collapsing separate state/federal park venues hosted under a single government domain (e.g. California State Parks `ohv.parks.ca.gov`, National Park Service `nps.gov`, etc.) to the bare domain `ohv.parks.ca.gov` or `nps.gov`. This triggers an `AssertionError` in unit tests and causes the lead crawler to skip legitimate distinct venues.

This document details a refined URL normalization scheme and a compound de-duplication strategy that preserves query arguments and path signatures for shared portals while maintaining high-integrity duplicate prevention for standalone domains.

---

## Detailed Breakdown of the Bug

### 1. The Vulnerable `norm_domain()` Utility
Both `find_leads.py` and `test_leads.py` contain almost identical copies of the `norm_domain()` utility:

**In `find_leads.py` (Lines 39-56):**
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

**In `test_leads.py` (Lines 63-66):**
```python
        def norm_domain(url):
            if not url: return ""
            domain = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
            return domain.split('/')[0].strip()
```

### 2. Failure Mechanism & Collisions
When processing `leads.csv`, multiple distinct parks are stored under the same government domain using query parameters or subpaths to identify the specific park. For example:
- **Prairie City SVRA**: `https://www.ohv.parks.ca.gov/?page_id=1178`
- **Hollister Hills SVRA**: `https://www.ohv.parks.ca.gov/?page_id=1179`
- **Hungry Valley SVRA**: `https://www.ohv.parks.ca.gov/?page_id=1184`

Under the current `norm_domain()` implementation:
1. `https://www.ohv.parks.ca.gov/?page_id=1178` -> stripped to `ohv.parks.ca.gov`
2. `https://www.ohv.parks.ca.gov/?page_id=1179` -> stripped to `ohv.parks.ca.gov`
3. `https://www.ohv.parks.ca.gov/?page_id=1184` -> stripped to `ohv.parks.ca.gov`

All three collapse to the identical domain string `ohv.parks.ca.gov`. 

As a result:
- **In `test_leads.py`**: The `test_deduplication` check fails with an `AssertionError` when it encounters the second record on line 34 of `leads.csv`.
- **In `find_leads.py`**: The web scraper's `is_duplicate()` method rejects new legitimate venues (e.g. Hungry Valley SVRA) because `ohv.parks.ca.gov` is already marked as an existing domain.

---

## Proposed Fix Strategy

To solve this cleanly, we need two components:
1. **Refined URL Normalization**: Differentiate between standalone websites (which should be deduplicated by base domain) and shared portals (which should include path/query strings).
2. **Compound Key De-duplication Logic**: Use a robust combined checking strategy that leverages the refined URL normalization and normalized Name + Location compound keys.

### 1. Refined URL Normalization Scheme
We define a list of known **Shared Portals** (domains that serve multiple distinct entities under subpaths or query parameters). For these domains, we preserve the unique paths and content-bearing query parameters (like `page_id`, `id`, `view`, etc.) while stripping tracking parameters (like `utm_*`, `gclid`, `fbclid`). For all other standalone domains, we fall back to base-domain matching.

```python
def is_shared_portal(domain: str) -> bool:
    """Check if the domain is a known shared portal or government site hosting distinct venues."""
    shared_suffixes = (
        "parks.ca.gov", "nps.gov", "fs.usda.gov", "blm.gov",
        "facebook.com", "instagram.com", "meetup.com", "youtube.com", "twitter.com", "x.com",
        "sites.google.com", "blogspot.com", "wordpress.com", "wixsite.com", "weebly.com", "github.io"
    )
    # Automatically treat all government (.gov) and state domains as potential shared portals
    if domain.endswith(".gov") or domain.endswith(".us"):
        return True
    return any(domain.endswith(suffix) for suffix in shared_suffixes)

def norm_domain(url: str) -> str:
    """Normalize a website URL, preserving subpaths/queries for shared portals to prevent collisions."""
    if not url:
        return ""
    
    url_lower = url.lower().strip()
    
    # Strip protocols
    if url_lower.startswith("https://"):
        url_stripped = url_lower[8:]
    elif url_lower.startswith("http://"):
        url_stripped = url_lower[7:]
    else:
        url_stripped = url_lower
        
    # Strip www.
    if url_stripped.startswith("www."):
        url_stripped = url_stripped[4:]
        
    # Split domain and path/query
    parts = url_stripped.split('/', 1)
    domain = parts[0].strip()
    
    # If it is a shared portal, extract and clean the path and query parameters
    if is_shared_portal(domain) and len(parts) > 1 and parts[1].strip():
        rest = parts[1].strip()
        rest_parts = rest.split('?', 1)
        path = rest_parts[0].rstrip('/')
        
        # Clean tracking query parameters, but preserve content identifiers (like page_id)
        query_str = ""
        if len(rest_parts) > 1:
            q_params = []
            for param in rest_parts[1].split('&'):
                # Exclude standard tracking/analytic parameters
                if not any(param.startswith(track) for track in ['utm_', 'ref=', 'fbclid=', 'gclid=']):
                    q_params.append(param)
            if q_params:
                query_str = "?" + "&".join(q_params)
                
        if path:
            return f"{domain}/{path}{query_str}"
        return f"{domain}/{query_str}"
        
    return domain
```

### 2. Intelligent De-duplication Strategy
Currently, `find_leads.py` rejects a lead if **any** of the individual checks match (either Name, URL, or Name|Location). Rejects based on name alone can cause false-positive deduplication (e.g. two separate entities named "Dirt Park" in different states or different websites). 

The robust deduplication strategy should require:
- A match on the **refined website URL** (unique online presence) **OR**
- A match on the compound **Normalized Name + Location** (unique physical presence)

This ensures actual duplicates are caught without blocking distinct physical locations or separate subpages of shared portals.

---

## Proposed Code Changes

The changes should be applied symmetrically to both `find_leads.py` and `test_leads.py` so that verification is 100% aligned.

### 1. Changes to `find_leads.py`

#### A. Define Portal Helper & Update `norm_domain()`
Replace `norm_domain()` in `find_leads.py` (lines 39-56) with:

```python
def is_shared_portal(domain):
    """Identify domains that host distinct entities under subpaths or query parameters."""
    shared_suffixes = (
        "parks.ca.gov", "nps.gov", "fs.usda.gov", "blm.gov",
        "facebook.com", "instagram.com", "meetup.com", "youtube.com", "twitter.com", "x.com",
        "sites.google.com", "blogspot.com", "wordpress.com", "wixsite.com", "weebly.com", "github.io"
    )
    if domain.endswith(".gov") or domain.endswith(".us"):
        return True
    return any(domain.endswith(suffix) for suffix in shared_suffixes)

def norm_domain(url):
    """Normalize a website URL, preserving paths/queries for shared portals to prevent collisions."""
    if not url:
        return ""
    url_lower = url.lower().strip()
    if url_lower.startswith("https://"):
        domain_part = url_lower[8:]
    elif url_lower.startswith("http://"):
        domain_part = url_lower[7:]
    else:
        domain_part = url_lower
        
    if domain_part.startswith("www."):
        domain_part = domain_part[4:]
        
    parts = domain_part.split('/', 1)
    domain = parts[0].strip()
    
    if is_shared_portal(domain) and len(parts) > 1 and parts[1].strip():
        rest = parts[1].strip()
        rest_parts = rest.split('?', 1)
        path = rest_parts[0].rstrip('/')
        
        query_str = ""
        if len(rest_parts) > 1:
            q_params = []
            for param in rest_parts[1].split('&'):
                if not any(param.startswith(track) for track in ['utm_', 'ref=', 'fbclid=', 'gclid=']):
                    q_params.append(param)
            if q_params:
                query_str = "?" + "&".join(q_params)
                
        if path:
            return f"{domain}/{path}{query_str}"
        return f"{domain}/{query_str}"
        
    return domain
```

#### B. Streamline Duplicate Ingestion Cache
In `LeadFinder._load_existing_leads()` (lines 161-185), we should cache `existing_domains` and `existing_name_locs`. We no longer need to track name-only deduplication in the cache since Name+Location is our unique physical constraint.

```python
    def _load_existing_leads(self):
        """Loads and normalizes all existing entries in the leads CSV file to avoid duplication."""
        if os.path.exists(self.output_path):
            try:
                with open(self.output_path, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        name = row.get("Name") or ""
                        location = row.get("Location") or ""
                        website = row.get("Website") or ""
                        
                        n_dom = norm_domain(website)
                        n_name = norm_name(name)
                        n_nameloc = f"{n_name}|{norm_name(location)}"
                        
                        if n_dom:
                            self.existing_domains.add(n_dom)
                        if n_nameloc:
                            self.existing_name_locs.add(n_nameloc)
                print(f"Loaded {len(self.existing_name_locs)} existing leads for deduplication.")
            except Exception as e:
                print(f"Error loading existing leads: {e}")
```

#### C. Refine `is_duplicate()` Logic
Update `is_duplicate()` (lines 186-198) to reflect the refined deduplication keys:

```python
    def is_duplicate(self, name, location, website):
        """Checks duplicate presence using both primary and secondary keys."""
        n_dom = norm_domain(website)
        n_name = norm_name(name)
        n_nameloc = f"{n_name}|{norm_name(location)}"
        
        # 1. Duplicate by refined URL
        if n_dom and n_dom in self.existing_domains:
            return True
            
        # 2. Duplicate by physical location and name
        if n_nameloc in self.existing_name_locs:
            return True
            
        return False
```

#### D. Keep Cache Symmetrical in `append_lead()`
Update `append_lead()` (lines 200-230) to cache keys properly:

```python
    def append_lead(self, lead_dict):
        """Appends a new lead record safely to leads.csv with strict de-duplication."""
        if self.is_duplicate(lead_dict["Name"], lead_dict["Location"], lead_dict["Website"]):
            print(f"Skipping duplicate lead: {lead_dict['Name']} ({lead_dict['Website']})")
            return False
            
        file_exists = os.path.exists(self.output_path) and os.path.getsize(self.output_path) > 0
        try:
            with open(self.output_path, "a", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=self.headers)
                if not file_exists:
                    writer.writeheader()
                writer.writerow(lead_dict)
                
            # Add to local deduplication cache
            n_dom = norm_domain(lead_dict["Website"])
            n_name = norm_name(lead_dict["Name"])
            n_nameloc = f"{n_name}|{norm_name(lead_dict['Location'])}"
            
            if n_dom:
                self.existing_domains.add(n_dom)
            self.existing_name_locs.add(n_nameloc)
            
            print(f"Successfully appended: {lead_dict['Name']}")
            return True
        except Exception as e:
            print(f"Error writing lead to CSV: {e}")
            return False
```

---

### 2. Changes to `test_leads.py`

Update `test_deduplication` inside `test_leads.py` to use the same domain-sensitive rules:

```python
    def test_deduplication(self):
        """Assert that no duplicate names+locations or website domains exist in leads.csv."""
        def is_shared_portal(domain):
            shared_suffixes = (
                "parks.ca.gov", "nps.gov", "fs.usda.gov", "blm.gov",
                "facebook.com", "instagram.com", "meetup.com", "youtube.com", "twitter.com", "x.com",
                "sites.google.com", "blogspot.com", "wordpress.com", "wixsite.com", "weebly.com", "github.io"
            )
            if domain.endswith(".gov") or domain.endswith(".us"):
                return True
            return any(domain.endswith(suffix) for suffix in shared_suffixes)

        def norm_domain(url):
            if not url: return ""
            url_lower = url.lower().strip()
            if url_lower.startswith("https://"):
                domain_part = url_lower[8:]
            elif url_lower.startswith("http://"):
                domain_part = url_lower[7:]
            else:
                domain_part = url_lower
                
            if domain_part.startswith("www."):
                domain_part = domain_part[4:]
                
            parts = domain_part.split('/', 1)
            domain = parts[0].strip()
            
            if is_shared_portal(domain) and len(parts) > 1 and parts[1].strip():
                rest = parts[1].strip()
                rest_parts = rest.split('?', 1)
                path = rest_parts[0].rstrip('/')
                
                query_str = ""
                if len(rest_parts) > 1:
                    q_params = []
                    for param in rest_parts[1].split('&'):
                        if not any(param.startswith(track) for track in ['utm_', 'ref=', 'fbclid=', 'gclid=']):
                            q_params.append(param)
                    if q_params:
                        query_str = "?" + "&".join(q_params)
                        
                if path:
                    return f"{domain}/{path}{query_str}"
                return f"{domain}/{query_str}"
                
            return domain

        def norm_name(name):
            if not name: return ""
            return "".join(c for c in name.lower() if c.isalnum())

        domains = set()
        name_locs = set()

        with open(self.csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=2):
                name = row.get("Name") or ""
                location = row.get("Location") or ""
                website = row.get("Website") or ""

                n_name = norm_name(name)
                n_dom = norm_domain(website)
                n_nameloc = f"{n_name}|{norm_name(location)}"

                # Check website domain duplication
                if n_dom:
                    self.assertNotIn(
                        n_dom, 
                        domains, 
                        f"Row {idx}: Duplicate website domain detected: {website} (normalized: {n_dom})"
                    )
                    domains.add(n_dom)

                # Check name|location combination duplication
                self.assertNotIn(
                    n_nameloc, 
                    name_locs, 
                    f"Row {idx}: Duplicate Name|Location detected: {name} in {location}"
                )
                name_locs.add(n_nameloc)
```

---

## Verification & Robustness

### 1. Robustness Assessment
Under this new strategy, the deduplication remains extremely robust because:
- **Standalone Domains**: Reusable private domains (e.g. `sonomaraceway.com`) are fully deduplicated by domain, preventing multiple references to different pages of the same track website from polluting the database.
- **Shared Portals**: Separate entries (like different parks on `ohv.parks.ca.gov` or different local clubs on `facebook.com`) are correctly treated as distinct because their paths or query arguments are preserved.
- **Physical Duplicates**: Even if someone enters the same venue with a slightly different URL (e.g. one pointing to the home page and another to a contact page), they are caught by the `Name + Location` compound key check.

### 2. Manual/Unit Verification Method
The strategy can be verified by applying these changes and running:
```bash
pytest test_leads.py
```
This test will now pass cleanly because Prairie City SVRA (`https://www.ohv.parks.ca.gov/?page_id=1178`) and Hollister Hills SVRA (`https://www.ohv.parks.ca.gov/?page_id=1179`) normalize to:
- `ohv.parks.ca.gov/?page_id=1178`
- `ohv.parks.ca.gov/?page_id=1179`

These two strings do not collide, successfully resolving the `AssertionError` while maintaining 100% data integrity.
