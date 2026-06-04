## 2026-05-22T15:02:03Z

You are a Versatile worker with loadable domain expertise. Your working directory is c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_worker_m1_gen2.
Your mission is to implement three high-priority fixes for Milestone 1 in both `c:\_Projects\Gridpass-v4\business_launch\find_leads.py` and `c:\_Projects\Gridpass-v4\business_launch\test_leads.py` so that our test suite passes cleanly and the scraper handles shared government portals correctly.

### Context
Milestone 1 implements a lead scraper `find_leads.py` and a central database `leads.csv`. 
In the previous run, the test suite triggered an `AssertionError` because the URL normalization collapsed different state parks hosted under the same government domain (e.g. `https://www.ohv.parks.ca.gov/?page_id=1179` and `https://www.ohv.parks.ca.gov/?page_id=1178`) into the same base domain string, resulting in duplicate detection failures. Additionally, there are category mapping and subpage crawling contamination bugs.

### Tasks to Perform
You are required to modify the code in place in the workspace. Do NOT create new files; edit the existing files.

#### Fix 1: Hybrid Domain-Aware Normalization in `find_leads.py` and `test_leads.py`
Replace the implementation of `norm_domain(url)` in BOTH `find_leads.py` (lines 39-56) and `test_leads.py` (locally inside `test_deduplication`, lines 63-66) with this exact, robust hybrid domain-aware normalizer:

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
Make sure in `test_leads.py` the `norm_domain(url)` definition inside `test_deduplication` matches this exactly. Also ensure `import urllib.parse` is imported at the top of the file.

#### Fix 2: Dynamic Category Mapping for CLI `--category all`
1. Update `map_category_to_enum(category_str)` in `find_leads.py` to support `'all'`, returning `'all'`.
2. Update `find_leads` method in the `LeadFinder` class. If the category is `'all'` (or `enum_category == "all"`), update the search engines fallback logic. Loop sequentially through the list of subcategories `["track", "offroad", "car_club"]` inside the search fallback. Construct the correct query string for each subcategory, query the search engine, crawl the results, and assign the proper `cat_enum` dynamically to each crawled lead so that they are correctly categorized instead of all defaulting to track.

#### Fix 3: Subpage Contamination Filtering in `crawl_website`
In `LeadFinder.crawl_website` in `find_leads.py`:
1. Use `urllib.parse` to extract the `home_host` of the `homepage_url`. Detect if the site is a shared portal using the same checks as above (`home_host in known_shared` or `.gov` or `.fed.us` or `.state.us`).
2. Inside the subpage URL discovery loop, if it is a shared portal, apply constraints:
   - Path Check: Parse the path of `homepage_url` (`home_path`). If it is deeper than `'/'`, ensure the parsed path of `full_sub_url` starts with `home_path` (ensure directory structure starts with `home_path` by standardizing trailing slashes).
   - Query Check: If the homepage query contains any venue-identifying parameters (`page_id`, `id`, `parkid`, `park`, `venue`), ensure they are present and match exactly in `full_sub_url`'s query parameters. If they do not match or are missing, skip the link.

### Verification
Once implementation is complete, run:
1. Syntax check: `python -m py_compile find_leads.py test_leads.py`
2. Test suite run: `python -m unittest test_leads.py`
3. Verify that the test suite passes 100% cleanly without errors.

MANDATORY INTEGRITY WARNING — include this verbatim in the Worker's dispatch prompt:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

Please report back with your `handoff.md` and verification results.
