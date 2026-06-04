#!/usr/bin/env python3
"""
Programmatic Lead Finder Utility for gridpass.app.
Milestone 1: Target Venue & Car Club Lead Database and Programmatic Search Tool.
"""

import os
import csv
import re
import time
import random
import urllib.parse
import argparse
import requests
from bs4 import BeautifulSoup

# Real-world browser user agents to mimic human behavior
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
]

STATE_MAP = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO",
    "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
    "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
    "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
    "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY"
}

KNOWN_SHARED = {
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
    is_shared = (
        domain in KNOWN_SHARED or 
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

def norm_name(name):
    """Normalize a name to alphanumeric characters only for case-insensitive deduplication."""
    if not name:
        return ""
    return "".join(c for c in name.lower() if c.isalnum())

def is_valid_email(email):
    """Filter out noise and false positive emails."""
    email = email.lower()
    # Check simple regex validation
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        return False
    # Check invalid extensions
    ignored_exts = ('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js', '.woff', '.woff2', '.pdf')
    if any(email.endswith(ext) for ext in ignored_exts):
        return False
    # Check false domains
    ignored_domains = ('sentry.io', 'wixpress.com', 'example.com', 'domain.com', 'yourdomain.com', 'email.com', 'sentry-next.wixpress.com')
    if any(domain in email for domain in ignored_domains):
        return False
    return True

def clean_lead_name(name):
    """Strip common search noise and headers from extracted website titles."""
    noise_patterns = [
        r'\bhome\b', r'\bwelcome\b', r'\bwebsite\b', r'\bofficial site\b', 
        r'\bofficial website\b', r'\bcontact us\b', r'\babout us\b', 
        r'\bmain page\b', r'\bindex\b'
    ]
    name_clean = name.strip()
    name_clean = re.sub(r'^[-\s|/]+', '', name_clean)
    name_clean = re.sub(r'[-\s|/]+$', '', name_clean)
    
    # Split by common separator strings to isolate the entity name
    for separator in [' - ', ' | ', ' :: ', ' : ']:
        if separator in name_clean:
            parts = name_clean.split(separator)
            valid_parts = []
            for p in parts:
                p_clean = p.strip()
                if p_clean and not any(re.search(pat, p_clean.lower()) for pat in noise_patterns):
                    valid_parts.append(p_clean)
            if valid_parts:
                name_clean = valid_parts[0]
                break
                
    return name_clean.strip()

def clean_social_url(url, domain_keyword):
    """Standardize social media profile URL."""
    url = url.split('?')[0].split('#')[0].strip()
    if not url.startswith('http'):
        url = 'https://' + url.lstrip('/')
    # Ensure it features the domain keyword nicely
    if domain_keyword in url:
        return url
    return ""

def extract_socials(soup, html_text):
    """Parse social media pages out of BeautifulSoup elements or raw HTML text."""
    instagram = ""
    facebook = ""
    
    for a in soup.find_all('a', href=True):
        href = a['href'].strip()
        href_lower = href.lower()
        if 'instagram.com/' in href_lower and not instagram:
            instagram = clean_social_url(href, 'instagram.com')
        if 'facebook.com/' in href_lower and not facebook:
            facebook = clean_social_url(href, 'facebook.com')
            
    # Regex fallback
    if not instagram:
        match = re.search(r'https?://(?:www\.)?instagram\.com/[a-zA-Z0-9_.]+', html_text)
        if match:
            instagram = clean_social_url(match.group(0), 'instagram.com')
    if not facebook:
        match = re.search(r'https?://(?:www\.)?facebook\.com/[a-zA-Z0-9_.-]+', html_text)
        if match:
            facebook = clean_social_url(match.group(0), 'facebook.com')
            
    return instagram, facebook

def map_category_to_enum(category_str):
    """Maps command-line input category strings to unified leads.csv category values."""
    cat = category_str.lower().strip()
    if cat == 'all':
        return 'all'
    elif cat in ['track', 'tracks', 'track & racing circuit']:
        return "Track & Racing Circuit"
    elif cat in ['offroad', 'offroads', 'offroad & adventure park']:
        return "Offroad & Adventure Park"
    elif cat in ['car_club', 'clubs', 'club', 'enthusiast car club & organizer', 'enthusiast car club']:
        return "Enthusiast Car Club & Organizer"
    return "Track & Racing Circuit"

class LeadFinder:
    def __init__(self, output_path="leads.csv"):
        self.output_path = output_path
        self.headers = ["Name", "Category", "Location", "Website", "Email", "Phone", "Instagram", "Facebook"]
        self.existing_domains = set()
        self.existing_names = set()
        self.existing_name_locs = set()
        self._load_existing_leads()

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
                        if n_name:
                            self.existing_names.add(n_name)
                        if n_nameloc:
                            self.existing_name_locs.add(n_nameloc)
                print(f"Loaded {len(self.existing_names)} existing leads for deduplication.")
            except Exception as e:
                print(f"Error loading existing leads: {e}")

    def is_duplicate(self, name, location, website):
        """Checks duplicate presence using both primary and secondary keys."""
        n_dom = norm_domain(website)
        n_name = norm_name(name)
        n_nameloc = f"{n_name}|{norm_name(location)}"
        
        if n_dom and n_dom in self.existing_domains:
            return True
        if n_nameloc in self.existing_name_locs:
            return True
        return False

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
            if n_name:
                self.existing_names.add(n_name)
            self.existing_name_locs.add(n_nameloc)
            
            print(f"Successfully appended: {lead_dict['Name']}")
            return True
        except Exception as e:
            print(f"Error writing lead to CSV: {e}")
            return False

    def crawl_website(self, homepage_url):
        """Crawls target URL and prominent subpages to parse email, phone, and social handles."""
        result = {"Email": "", "Phone": "", "Instagram": "", "Facebook": ""}
        if not homepage_url or not homepage_url.startswith("http"):
            return result
            
        print(f"Initializing contact crawl on: {homepage_url}")
        
        parsed_home = urllib.parse.urlparse(homepage_url)
        home_host = parsed_home.netloc.lower()
        if home_host.startswith("www."):
            home_host = home_host[4:]
            
        is_shared = (
            home_host in KNOWN_SHARED or 
            home_host.endswith(".gov") or 
            home_host.endswith(".fed.us") or 
            home_host.endswith(".state.us")
        )
        
        emails = set()
        phones = set()
        instagram = ""
        facebook = ""
        
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        }
        
        session = requests.Session()
        urls_to_crawl = [homepage_url]
        visited_urls = set()
        
        max_subpages = 2
        pages_crawled = 0
        domain = norm_domain(homepage_url)
        
        while urls_to_crawl and pages_crawled < (1 + max_subpages):
            url = urls_to_crawl.pop(0)
            if url in visited_urls:
                continue
                
            visited_urls.add(url)
            pages_crawled += 1
            
            # Request delay compliance
            delay = random.uniform(2.0, 5.0)
            print(f"Retrieving: {url} (Compliance pause {delay:.2f}s...)")
            time.sleep(delay)
            
            try:
                response = session.get(url, headers=headers, timeout=10)
                if response.status_code != 200:
                    continue
                    
                html_text = response.text
                soup = BeautifulSoup(html_text, 'html.parser')
                
                # Extract Email addresses
                found_emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html_text)
                for email in found_emails:
                    if is_valid_email(email):
                        emails.add(email.lower())
                        
                # Extract Phone numbers and standardize
                phone_pattern = re.compile(r'(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})')
                found_phones = phone_pattern.findall(html_text)
                for p in found_phones:
                    phones.add(f"({p[0]}) {p[1]}-{p[2]}")
                    
                # Extract Social profiles
                inst_found, fb_found = extract_socials(soup, html_text)
                if inst_found and not instagram:
                    instagram = inst_found
                if fb_found and not facebook:
                    facebook = fb_found
                    
                # Homepage discovery of subpages
                if url == homepage_url:
                    for a in soup.find_all('a', href=True):
                        href = a['href'].strip()
                        full_sub_url = urllib.parse.urljoin(homepage_url, href)
                        parsed_sub = urllib.parse.urlparse(full_sub_url)
                        sub_host = parsed_sub.netloc.lower()
                        if sub_host.startswith("www."):
                            sub_host = sub_host[4:]
                        
                        if sub_host == home_host and full_sub_url not in visited_urls:
                            if is_shared:
                                
                                # Path Check
                                home_path = parsed_home.path
                                if home_path and home_path != '/':
                                    norm_home_path = home_path if home_path.endswith('/') else home_path + '/'
                                    sub_path = parsed_sub.path
                                    norm_sub_path = sub_path if sub_path.endswith('/') else sub_path + '/'
                                    if not norm_sub_path.startswith(norm_home_path):
                                        continue
                                        
                                # Query Check
                                home_query = urllib.parse.parse_qs(parsed_home.query)
                                sub_query = urllib.parse.parse_qs(parsed_sub.query)
                                venue_params = {'page_id', 'id', 'parkid', 'park', 'venue'}
                                
                                skip_link = False
                                for param in venue_params:
                                    if param in home_query:
                                        if param not in sub_query or sub_query[param] != home_query[param]:
                                            skip_link = True
                                            break
                                if skip_link:
                                    continue
                                    
                            href_lower = href.lower()
                            link_text_lower = a.get_text().lower()
                            
                            keywords = ['contact', 'about', 'join', 'info', 'location', 'reach', 'find']
                            if any(kw in href_lower or kw in link_text_lower for kw in keywords):
                                if full_sub_url not in urls_to_crawl:
                                    urls_to_crawl.append(full_sub_url)
                                    
            except Exception as e:
                print(f"Error crawling {url}: {e}")
                
        result["Email"] = sorted(list(emails))[0] if emails else ""
        result["Phone"] = sorted(list(phones))[0] if phones else ""
        result["Instagram"] = instagram
        result["Facebook"] = facebook
        
        return result

    def query_overpass(self, category, state=None, city=None, zip_code=None):
        """Structured primary venue discovery querying OpenStreetMap Overpass QL API."""
        print("Running OpenStreetMap Overpass search...")
        
        # Build location-based area query
        area_filter = ""
        if zip_code:
            area_filter = f'area["postal_code"="{zip_code}"]->.searchArea;'
        elif state:
            state_code = STATE_MAP.get(state.lower(), state.upper())
            area_filter = f'area["ISO3166-2"="US-{state_code}"]->.searchArea;'
        elif city:
            area_filter = f'area["name"="{city}"]->.searchArea;'
        else:
            area_filter = 'area["ISO3166-1"="US"]->.searchArea;'
            
        tags = []
        if category in ['track', 'tracks', 'all']:
            tags.extend([
                'node["leisure"="track"]["sport"~"motor|karting"](area.searchArea);',
                'way["leisure"="track"]["sport"~"motor|karting"](area.searchArea);',
                'relation["leisure"="track"]["sport"~"motor|karting"](area.searchArea);',
                'node["highway"="raceway"](area.searchArea);',
                'way["highway"="raceway"](area.searchArea);',
                'relation["highway"="raceway"](area.searchArea);',
                'node["leisure"="motor_sports"](area.searchArea);',
                'way["leisure"="motor_sports"](area.searchArea);',
                'relation["leisure"="motor_sports"](area.searchArea);'
            ])
        if category in ['offroad', 'all']:
            tags.extend([
                'node["leisure"="offroad"](area.searchArea);',
                'way["leisure"="offroad"](area.searchArea);',
                'relation["leisure"="offroad"](area.searchArea);',
                'node["route"="motocross"](area.searchArea);',
                'way["route"="motocross"](area.searchArea);',
                'relation["route"="motocross"](area.searchArea);',
                'node["leisure"="off_highway_vehicle"](area.searchArea);',
                'way["leisure"="off_highway_vehicle"](area.searchArea);',
                'relation["leisure"="off_highway_vehicle"](area.searchArea);'
            ])
            
        if not tags:
            print("OSM Overpass not applicable for requested category.")
            return []
            
        query = f"""[out:json][timeout:30];
        {area_filter}
        (
          {" ".join(tags)}
        );
        out center;"""
        
        url = "https://overpass-api.de/api/interpreter"
        headers = {"User-Agent": random.choice(USER_AGENTS)}
        
        try:
            response = requests.post(url, data={"data": query}, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for element in data.get("elements", []):
                tags = element.get("tags", {})
                name = tags.get("name")
                if not name:
                    continue
                    
                website = tags.get("website") or tags.get("contact:website") or ""
                city_tag = tags.get("addr:city")
                state_tag = tags.get("addr:state")
                
                if city_tag and state_tag:
                    location = f"{city_tag}, {state_tag}"
                else:
                    parts = []
                    if city: parts.append(city)
                    if state: parts.append(state.upper())
                    location = ", ".join(parts) or "US"
                    
                email = tags.get("contact:email") or tags.get("email") or ""
                phone = tags.get("contact:phone") or tags.get("phone") or ""
                instagram = tags.get("contact:instagram") or ""
                facebook = tags.get("contact:facebook") or ""
                
                # Format socials
                if instagram and not instagram.startswith('http'):
                    instagram = f"https://www.instagram.com/{instagram}"
                if facebook and not facebook.startswith('http'):
                    facebook = f"https://www.facebook.com/{facebook}"
                    
                # Determine Enum segment classification
                mapped_cat = "Track & Racing Circuit"
                if category == 'offroad' or (tags.get("leisure") == "offroad" or tags.get("route") == "motocross" or tags.get("leisure") == "off_highway_vehicle"):
                    mapped_cat = "Offroad & Adventure Park"
                    
                results.append({
                    "Name": name,
                    "Category": mapped_cat,
                    "Location": location,
                    "Website": website,
                    "Email": email,
                    "Phone": phone,
                    "Instagram": instagram,
                    "Facebook": facebook
                })
            print(f"OSM Overpass retrieved {len(results)} candidate leads.")
            return results
        except Exception as e:
            print(f"Overpass query error: {e}")
            return []

    def query_duckduckgo(self, query_str):
        """Zero-dependency search fallback querying DuckDuckGo's non-Javascript HTML search."""
        url = "https://html.duckduckgo.com/html/"
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        print(f"Searching DuckDuckGo HTML for: '{query_str}'")
        try:
            session = requests.Session()
            # Prime session
            session.get("https://duckduckgo.com/", headers={"User-Agent": headers["User-Agent"]}, timeout=10)
            time.sleep(1.5)
            
            response = session.post(url, data={"q": query_str}, headers=headers, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            results = []
            
            for div in soup.find_all('div', class_='result'):
                a_tag = div.find('a', class_='result__snippet') or div.find('a', class_='result__a') or div.find('a', class_='result__url')
                if not a_tag:
                    continue
                    
                title = a_tag.get_text().strip()
                raw_url = a_tag.get('href')
                
                actual_url = ""
                if raw_url:
                    if '/l/?uddg=' in raw_url:
                        parsed = urllib.parse.urlparse(raw_url)
                        query_params = urllib.parse.parse_qs(parsed.query)
                        uddg = query_params.get('uddg')
                        if uddg:
                            actual_url = uddg[0]
                    elif raw_url.startswith('//'):
                        actual_url = 'https:' + raw_url
                    else:
                        actual_url = raw_url
                        
                # Skip social profiles, indexing registries, or search tools in target list
                ignored_keywords = [
                    'duckduckgo.com', 'wikipedia.org', 'facebook.com', 'instagram.com', 
                    'youtube.com', 'twitter.com', 'yelp.com', 'tripadvisor.com'
                ]
                if actual_url and not any(keyword in actual_url.lower() for keyword in ignored_keywords):
                    results.append({
                        "title": title,
                        "url": actual_url
                    })
                    
            print(f"DuckDuckGo found {len(results)} potential target websites.")
            return results
        except Exception as e:
            print(f"DuckDuckGo HTML query error: {e}")
            return []

    def query_google_custom_search(self, query_str):
        """Enterprise search fallback querying Google's Custom Search JSON API."""
        api_key = os.environ.get("GOOGLE_API_KEY")
        cx = os.environ.get("GOOGLE_CX")
        if not api_key or not cx:
            print("Google CSE environment parameters not found. Skipping Google fallback.")
            return []
            
        print(f"Searching Google CSE for: '{query_str}'")
        url = "https://www.googleapis.com/customsearch/v1"
        params = {"q": query_str, "key": api_key, "cx": cx, "num": 10}
        headers = {"User-Agent": random.choice(USER_AGENTS)}
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data.get("items", []):
                title = item.get("title", "")
                link = item.get("link", "")
                ignored_keywords = [
                    'wikipedia.org', 'facebook.com', 'instagram.com', 
                    'youtube.com', 'twitter.com', 'yelp.com', 'tripadvisor.com'
                ]
                if link and not any(keyword in link.lower() for keyword in ignored_keywords):
                    results.append({
                        "title": title,
                        "url": link
                    })
            print(f"Google CSE returned {len(results)} results.")
            return results
        except Exception as e:
            print(f"Google CSE error: {e}")
            return []

    def find_leads(self, category="all", state=None, city=None, zip_code=None, limit=10, source="auto"):
        """Execute the lead generation workflow."""
        enum_category = map_category_to_enum(category)
        print(f"\n--- Initiating Lead Acquisition for segment: '{enum_category}' ---")
        
        candidates = []
        
        # 1. Structured OSM Query (tracks/offroad)
        if source in ["auto", "osm"] and enum_category in ["Track & Racing Circuit", "Offroad & Adventure Park", "all"]:
            osm_candidates = self.query_overpass(category, state, city, zip_code)
            for cand in osm_candidates:
                # Resolve website contacts dynamically if Overpass fields are empty
                if cand["Website"] and (not cand["Email"] or not cand["Phone"]):
                    # Deduplicate before crawling to save requests
                    if not self.is_duplicate(cand["Name"], cand["Location"], cand["Website"]):
                        contacts = self.crawl_website(cand["Website"])
                        if contacts["Email"]: cand["Email"] = contacts["Email"]
                        if contacts["Phone"]: cand["Phone"] = contacts["Phone"]
                        if contacts["Instagram"]: cand["Instagram"] = contacts["Instagram"]
                        if contacts["Facebook"]: cand["Facebook"] = contacts["Facebook"]
                candidates.append(cand)
                
        # 2. Search Engines Fallback
        if len(candidates) < limit and source in ["auto", "ddg", "google"]:
            # Construct a human search string based on CLI inputs
            loc_query = ""
            if city: loc_query += f" {city}"
            if state: loc_query += f" {state}"
            if zip_code: loc_query += f" {zip_code}"
            
            subcategories = ["track", "offroad", "car_club"] if enum_category == "all" else [category]
            
            for sub_cat in subcategories:
                if len(candidates) >= limit:
                    break
                    
                sub_cat_enum = map_category_to_enum(sub_cat)
                
                search_term = ""
                if sub_cat_enum == "Track & Racing Circuit":
                    search_term = f"race track motor speedway karting circuit HPDE{loc_query}"
                elif sub_cat_enum == "Offroad & Adventure Park":
                    search_term = f"offroad park 4x4 recreation OHV dirt bike trails{loc_query}"
                elif sub_cat_enum == "Enthusiast Car Club & Organizer":
                    search_term = f"enthusiast car club automotive organization auto club meets{loc_query}"
                else:
                    search_term = f"enthusiast car club automotive organization auto club meets{loc_query}"
                
                web_results = []
                
                # Google custom search
                if source in ["auto", "google"]:
                    web_results = self.query_google_custom_search(search_term)
                    
                # DuckDuckGo HTML parser
                if not web_results and source in ["auto", "ddg"]:
                    web_results = self.query_duckduckgo(search_term)
                    
                for res in web_results:
                    if len(candidates) >= limit:
                        break
                        
                    cand_name = clean_lead_name(res["title"])
                    cand_website = res["url"]
                    
                    parts = []
                    if city: parts.append(city)
                    if state: parts.append(state.upper())
                    cand_loc = ", ".join(parts) or "US"
                    
                    # Check duplicate before crawling
                    if self.is_duplicate(cand_name, cand_loc, cand_website):
                        continue
                        
                    # Crawl website for missing contacts
                    contacts = self.crawl_website(cand_website)
                    
                    candidates.append({
                        "Name": cand_name,
                        "Category": sub_cat_enum,
                        "Location": cand_loc,
                        "Website": cand_website,
                        "Email": contacts["Email"],
                        "Phone": contacts["Phone"],
                        "Instagram": contacts["Instagram"],
                        "Facebook": contacts["Facebook"]
                    })
                
        # 3. Safe Appending Ingestion
        appended_count = 0
        for cand in candidates:
            if appended_count >= limit:
                break
            if self.append_lead(cand):
                appended_count += 1
                
        print(f"--- Lead Acquisition finished. Appended {appended_count} new leads to '{self.output_path}' ---\n")
        return appended_count

def parse_args():
    parser = argparse.ArgumentParser(description="Programmatic Lead Finder Tool for gridpass.app")
    parser.add_argument("--state", type=str, help="Two-letter state abbreviation or name (e.g. TX)")
    parser.add_argument("--city", type=str, help="City name for search (e.g. Austin)")
    parser.add_argument("--zip", type=str, help="5-digit postal code (e.g. 78701)")
    parser.add_argument("--category", type=str, default="all",
                        choices=["track", "tracks", "offroad", "car_club", "clubs", "all"],
                        help="Filter search category")
    parser.add_argument("--limit", type=int, default=10, help="Maximum number of new leads to retrieve and append")
    parser.add_argument("--source", type=str, choices=["google", "ddg", "osm", "auto"], default="auto",
                        help="Data source query strategy selection")
    parser.add_argument("--output", type=str, default="leads.csv", help="Central lead database output CSV path")
    return parser.parse_args()

def main():
    args = parse_args()
    finder = LeadFinder(output_path=args.output)
    finder.find_leads(
        category=args.category,
        state=args.state,
        city=args.city,
        zip_code=args.zip,
        limit=args.limit,
        source=args.source
    )

if __name__ == "__main__":
    main()
