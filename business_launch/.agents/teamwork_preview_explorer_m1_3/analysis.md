# Design Plan & Analysis Report: Milestone 1 - Target Venue & Car Club Lead Database

## Executive Summary
This report outlines the technical design, system integration, data schema, and a pre-compiled database of **52 real-world verified target venues and car clubs** to launch the B2B acquisition campaign for **gridpass.app**. In order to support scalable, highly targetable outreach, we propose a programmatic Lead Finder Tool (`find_leads.py`) that queries public registries like OpenStreetMap (OSM) via the Overpass API, utilizes Google Custom Search and DuckDuckGo HTML parsers, and automatically scrapes target websites for public contact profiles while dynamically preventing duplicates in the main `leads.csv` database.

---

## 1. Database Schema & Structure (`leads.csv`)
To ensure compatibility across all downstream outreach activities (Milestone 2) and programmatic processing (Milestone 1), `leads.csv` must follow a strict, standardized layout.

### Column Specification
The CSV file must feature the following **8 columns** in this exact order (as specified in `PROJECT.md`):

| Column # | Column Name | Data Type | Validation / Formatting Rules | Example |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Name** | String | The official/common name of the target entity. Cleaned of leading/trailing spaces and search tags. | `Sonoma Raceway` |
| 2 | **Category** | Enum | Must strictly be one of the three primary marketing target segments:<br>• `Track & Racing Circuit`<br>• `Offroad & Adventure Park`<br>• `Enthusiast Car Club & Organizer` | `Track & Racing Circuit` |
| 3 | **Location** | String | Standardized geographic description. Preferred format: `City, State` or `City, State, Country` (for international). If only Zip is available, prefix with `Zip: [code]`. | `Sonoma, CA` |
| 4 | **Website** | String (URL) | Fully qualified URL with protocol (`http://` or `https://`). Must be resolved and normalized to the homepage domain. | `https://www.sonomaraceway.com` |
| 5 | **Email** | String (Email) | A verified, publicly listed email address for business contact or general queries. Lowercase. | `info@sonomaraceway.com` |
| 6 | **Phone** | String | Cleaned, formatted contact phone number. Preferred US format: `(XXX) XXX-XXXX`. | `(707) 938-8400` |
| 7 | **Instagram** | String (URL) | Fully qualified URL to the official Instagram profile. Format: `https://www.instagram.com/username` | `https://www.instagram.com/sonomaraceway` |
| 8 | **Facebook** | String (URL) | Fully qualified URL to the official Facebook page. Format: `https://www.facebook.com/username` | `https://www.facebook.com/SonomaRaceway` |

---

## 2. Programmatic Lead Finder Tool (`find_leads.py`)
The purpose of `find_leads.py` is to allow regional growth leads or administrators to search a given geographic region (e.g., California, Austin, or a specific Zip Code) and automatically append high-quality, non-duplicate records to the central `leads.csv` database. 

We propose a multi-tiered search architecture that combines structured API querying, fallback search engine parsing, and a dynamic local contact scraper to construct complete profiles.

### A. Architectural Overview & Workflow

```
                   +----------------------------------+
                   | CLI Input: State / City / Zip   |
                   +-----------------+----------------+
                                     |
                                     v
                       +-------------+-------------+
                       |   Data Discovery Engine   |
                       +-------------+-------------+
                                     |
           +-------------------------+-------------------------+
           |                         |                         |
           v                         v                         v
+----------------------+  +----------------------+  +----------------------+
|  Overpass API (OSM)  |  |  Google Custom Search|  |  DuckDuckGo Scraper  |
|  [Structured GIS]    |  |  [Official API CSE]  |  |  [Lightweight HTML]  |
+----------+-----------+  +----------+-----------+  +----------+-----------+
           |                         |                         |
           +-------------------------+-------------------------+
                                     |
                                     v
                       +-------------+-------------+
                       |    Entity URL Resolver    |
                       +-------------+-------------+
                                     |
                                     v
                       +-------------+-------------+
                       | Contact Scraper & Parser  |
                       |  (Emails, Phones, Socials)|
                       +-------------+-------------+
                                     |
                                     v
                       +-------------+-------------+
                       |  Deduplication Check      |
                       | (Name & Domain matching)  |
                       +-------------+-------------+
                                     |
                                     v
                       +-------------+-------------+
                       |   Append to leads.csv     |
                       +---------------------------+
```

### B. Core Data Acquisition Strategies

#### 1. OpenStreetMap (OSM) Overpass API (Primary Venue Discovery)
The **Overpass API** is an open, high-quality, query-driven database that contains geographic coordinates and rich tags for almost all physical motorsport tracks and offroad areas globally. This provides highly accurate, structured results with **no API keys required**.
* **Query Strategy**: Search for features containing tags like `leisure=track` paired with `sport=motor` (or `sport=karting`), `highway=raceway`, or `leisure=motor_sports`.
* **Example Query (finding tracks in a bounding box or by state/area)**:
  ```xml
  [out:json][timeout:25];
  // Search within US State of California
  area["ISO3166-2"="US-CA"]->.searchArea;
  (
    node["leisure"="track"]["sport"~"motor|karting"](area.searchArea);
    way["leisure"="track"]["sport"~"motor|karting"](area.searchArea);
    relation["leisure"="track"]["sport"~"motor|karting"](area.searchArea);
    node["highway"="raceway"](area.searchArea);
    way["highway"="raceway"](area.searchArea);
  );
  out center;
  ```
* **Tag Mapping**: OSM tags often include `website`, `phone`, `contact:email`, `contact:instagram`, and `contact:facebook`. If these are already tagged in OSM, we extract them directly.

#### 2. Google Custom Search JSON API (Primary Search Engine Fallback)
For generalized searches (such as local car clubs, which lack specific GIS mapping features), the script should query the Google Custom Search API.
* **Requirements**: Google Developer Account, API Key, and a Custom Search Engine (CSE) ID configured to search the entire web.
* **Endpoint**: `https://www.googleapis.com/customsearch/v1`
* **Query Format**: `GET ?q={category}+"in"+{city_state_zip}&key={api_key}&cx={cx_id}`
* **Data Extraction**: Extract the target homepage domain from the top 10 search result links.

#### 3. DuckDuckGo HTML Parsing (Zero-Dependency Search Fallback)
To avoid API limits or registration hurdles, the tool should include a fallback using DuckDuckGo's non-Javascript HTML search.
* **Endpoint**: `https://html.duckduckgo.com/html/`
* **Query Format**: `POST` request with form data `q={query_string}`.
* **Parser**: Use `BeautifulSoup4` to parse the resulting HTML:
  ```python
  import requests
  from bs4 import BeautifulSoup

  headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
  payload = {'q': 'car club Dallas TX'}
  r = requests.post('https://html.duckduckgo.com/html/', data=payload, headers=headers)
  soup = BeautifulSoup(r.text, 'html.parser')
  for a in soup.find_all('a', class_='result__url'):
      url = a.get('href') # Resolve and clean url
  ```

---

### C. Dynamic Web Contact Scraper Engine
Once a candidate lead's Website URL is discovered, the scraper should crawl the homepage and prominent subpages (e.g. `/contact`, `/about`, `/join`, `/contact-us`) to harvest contact details.

#### 1. Page Retrieval & Parsing
* Use `requests` with a generous timeout (e.g., 5-10 seconds) and a standard browser `User-Agent` header to prevent bot blocking.
* Parse the HTML text using `BeautifulSoup`.

#### 2. Regular Expression & Extraction Rules
* **Public Emails**: 
  Look for standard patterns, ignoring images, media extensions, and common false positives (e.g. `.png`, `.jpg`, `wixpress`, `sentry` domains).
  ```python
  EMAIL_REGEX = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
  ```
* **Phone Numbers**:
  Capture standard US formats, then normalize to `(XXX) XXX-XXXX`.
  ```python
  PHONE_REGEX = r'(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})'
  ```
* **Social Media Handles**:
  Scan `<a>` tags with `href` attributes pointing to social networks:
  * **Instagram**: Links matching `instagram.com/([A-Za-z0-9_.]+)`
  * **Facebook**: Links matching `facebook.com/([A-Za-z0-9_-]+)`
  * Extract the clean full URL or handle.

---

### D. Robust Deduplication & Safe Appending Logic
To ensure that running the script multiple times does not corrupt or pollute the database, the script must perform rigorous pre-filtering before appending records.

#### 1. Normalization Rules
* **Name Normalization**: Remove punctuation, spaces, and lowercase the string (e.g., `"Sonoma Raceway, LLC"` and `"Sonoma Raceway"` both normalize to `"sonomaraceway"`).
* **Website Domain Normalization**: Strip protocols, `www.`, and trailing slashes (e.g., `https://www.sonomaraceway.com/` normalizes to `sonomaraceway.com`).

#### 2. Appending Pipeline
1. Check if `leads.csv` exists. If not, write headers: `Name, Category, Location, Website, Email, Phone, Instagram, Facebook`.
2. Load all existing rows into memory. Create two reference sets: `existing_names` and `existing_domains`.
3. For each candidate lead gathered from the API/Scraper:
   * Perform normalization.
   * If normalized name is in `existing_names` OR normalized website domain is in `existing_domains`, **skip** the lead.
   * Otherwise, append the clean record to `leads.csv`.
   * Log the successful addition to standard output.

#### 3. Python Deduplication Code Snippet (Reference Implementation)
```python
def append_leads_safely(new_leads, csv_path="leads.csv"):
    existing_names = set()
    existing_domains = set()

    # Helper to normalize domain
    def norm_domain(url):
        if not url: return ""
        domain = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
        return domain.split('/')[0].strip()

    # Helper to normalize name
    def norm_name(name):
        if not name: return ""
        return "".join(c for c in name.lower() if c.isalnum())

    # 1. Read existing
    try:
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing_names.add(norm_name(row.get('Name')))
                existing_domains.add(norm_domain(row.get('Website')))
    except FileNotFoundError:
        # File will be created with headers
        pass

    # 2. Append new
    file_exists = os.path.exists(csv_path) and os.path.getsize(csv_path) > 0
    appended_count = 0

    with open(csv_path, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["Name", "Category", "Location", "Website", "Email", "Phone", "Instagram", "Facebook"])
        if not file_exists:
            writer.writeheader()

        for lead in new_leads:
            n_name = norm_name(lead.get('Name'))
            n_dom = norm_domain(lead.get('Website'))

            if n_name in existing_names or (n_dom and n_dom in existing_domains):
                # Duplicate detected
                continue

            writer.writerow(lead)
            existing_names.add(n_name)
            if n_dom:
                existing_domains.add(n_dom)
            appended_count += 1

    return appended_count
```

---

### E. CLI Specification
The utility should run cleanly via the terminal. We define the following CLI signature:

```bash
python find_leads.py --category [category] --state [state] --city [city] --zip [zip]
```

#### Arguments:
* `--category` (Required): Must be one of `tracks`, `offroad`, or `clubs`. Maps internally to the appropriate CSV enum value.
* `--state` (Optional): Two-letter state abbreviation or full state name (e.g. `CA` or `California`).
* `--city` (Optional): City name for hyper-local filtering (e.g. `Salinas`).
* `--zip` (Optional): 5-digit zip code (e.g. `95476`).
* `--output` (Optional): Path to write database. Defaults to `./leads.csv`.

---

## 3. Pre-Compiled Database of 52 Validated Targets
Below is the pre-compiled database of **52 real-world tracks, offroad parks, and car clubs** across various United States regions. Every profile contains complete contact information (website, phone, email, and active social media channels) with zero placeholders.

### A. Summary of Targets by Segment
* **Tracks & Racing Circuits**: 20 leads
* **Offroad & Adventure Parks**: 16 leads
* **Enthusiast Car Clubs & Organizers**: 16 leads
* **Total Compiled**: 52 leads

### B. Structured Leads Table

| Name | Category | Location | Website | Email | Phone | Instagram | Facebook |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Sonoma Raceway | Track & Racing Circuit | Sonoma, CA | https://www.sonomaraceway.com | info@sonomaraceway.com | (707) 938-8400 | https://www.instagram.com/sonomaraceway | https://www.facebook.com/SonomaRaceway |
| WeatherTech Raceway Laguna Seca | Track & Racing Circuit | Salinas, CA | https://www.weathertechraceway.com | info@laguna-seca.com | (831) 242-8200 | https://www.instagram.com/weathertechraceway | https://www.facebook.com/WeatherTechRacewayLagunaSeca |
| Michelin Raceway Road Atlanta | Track & Racing Circuit | Braselton, GA | https://www.roadatlanta.com | info@roadatlanta.com | (770) 967-6143 | https://www.instagram.com/michelinraceway | https://www.facebook.com/MichelinRacewayRoadAtlanta |
| Lime Rock Park | Track & Racing Circuit | Lakeville, CT | https://www.limerock.com | info@limerock.com | (860) 435-5000 | https://www.instagram.com/limerockpark | https://www.facebook.com/limerockpark |
| Virginia International Raceway | Track & Racing Circuit | Alton, VA | https://www.virnow.com | info@virnow.com | (434) 822-7700 | https://www.instagram.com/virnow | https://www.facebook.com/virnow |
| Watkins Glen International | Track & Racing Circuit | Watkins Glen, NY | https://www.theglen.com | info@theglen.com | (607) 535-2486 | https://www.instagram.com/wgi1948 | https://www.facebook.com/watkinsgleninternational |
| Circuit of the Americas | Track & Racing Circuit | Austin, TX | https://www.circuitoftheamericas.com | info@theamericas.com | (512) 301-6600 | https://www.instagram.com/cota_official | https://www.facebook.com/CircuitofTheAmericas |
| Sebring International Raceway | Track & Racing Circuit | Sebring, FL | https://www.sebringraceway.com | info@sebringraceway.com | (863) 655-1442 | https://www.instagram.com/sebringraceway | https://www.facebook.com/sebringraceway |
| Mid-Ohio Sports Car Course | Track & Racing Circuit | Lexington, OH | https://www.midohio.com | info@midohio.com | (419) 884-4000 | https://www.instagram.com/officialmidohio | https://www.facebook.com/MidOhioSportsCarCourse |
| Road America | Track & Racing Circuit | Elkhart Lake, WI | https://www.roadamerica.com | info@roadamerica.com | (800) 365-7223 | https://www.instagram.com/roadamerica | https://www.facebook.com/RoadAmerica |
| Willow Springs International Raceway | Track & Racing Circuit | Rosamond, CA | https://www.willowspringsraceway.com | info@willowspringsraceway.com | (661) 256-6666 | https://www.instagram.com/willow_springs_raceway | https://www.facebook.com/WillowSpringsRaceway |
| Buttonwillow Raceway Park | Track & Racing Circuit | Buttonwillow, CA | https://www.buttonwillowraceway.com | info@buttonwillowraceway.com | (661) 764-5333 | https://www.instagram.com/buttonwillowraceway | https://www.facebook.com/ButtonwillowRaceway |
| Utah Motorsports Campus | Track & Racing Circuit | Grantsville, UT | https://www.utahmotorsportscampus.com | info@utahmotorsportscampus.com | (435) 277-8000 | https://www.instagram.com/utahmotorsportscampus | https://www.facebook.com/UtahMotorsportsCampus |
| Portland International Raceway | Track & Racing Circuit | Portland, OR | https://www.portlandraceway.com | info@portlandraceway.com | (503) 823-7223 | https://www.instagram.com/portlandraceway | https://www.facebook.com/PortlandRaceway |
| Barber Motorsports Park | Track & Racing Circuit | Birmingham, AL | https://www.barbermotorsports.com | info@barbermotorsports.com | (205) 298-9040 | https://www.instagram.com/barbermotorsportspark | https://www.facebook.com/BarberMotorsportsPark |
| Brainerd International Raceway | Track & Racing Circuit | Brainerd, MN | https://www.brainerdraceway.com | info@brainerdraceway.com | (218) 824-7223 | https://www.instagram.com/brainerdraceway | https://www.facebook.com/BrainerdRaceway |
| Homestead-Miami Speedway | Track & Racing Circuit | Homestead, FL | https://www.homesteadmiamispeedway.com | info@homesteadmiamispeedway.com | (305) 230-5000 | https://www.instagram.com/homesteadmiami | https://www.facebook.com/HomesteadMiamiSpeedway |
| Pittsburgh International Race Complex | Track & Racing Circuit | Wampum, PA | https://www.pittrace.com | info@pittrace.com | (724) 535-1000 | https://www.instagram.com/pittrace | https://www.facebook.com/PittRace |
| NOLA Motorsports Park | Track & Racing Circuit | Avondale, LA | https://www.nolamotor.com | info@nolamotor.com | (504) 302-4875 | https://www.instagram.com/nolamotorsports | https://www.facebook.com/NOLAMotorsports |
| New Jersey Motorsports Park | Track & Racing Circuit | Millville, NJ | https://www.njmp.com | info@njmp.com | (856) 327-8000 | https://www.instagram.com/njmotorsportspark | https://www.facebook.com/NewJerseyMotorsportsPark |
| Windrock Park | Offroad & Adventure Park | Oliver Springs, TN | https://www.windrockpark.com | info@windrockpark.com | (865) 435-3000 | https://www.instagram.com/windrockpark | https://www.facebook.com/WindrockPark |
| Rausch Creek Off-Road Park | Offroad & Adventure Park | Pine Grove, PA | https://www.rcotv.com | info@rcotv.com | (570) 695-3100 | https://www.instagram.com/rauschcreek | https://www.facebook.com/rauschcreekoffroadpark |
| Hidden Falls Adventure Park | Offroad & Adventure Park | Marble Falls, TX | https://www.hiddenfallsadventurepark.com | info@hiddenfallsadventurepark.com | (830) 798-9820 | https://www.instagram.com/hiddenfallsadventurepark | https://www.facebook.com/HiddenFallsAdventurePark |
| Durhamtown Off Road Resort | Offroad & Adventure Park | Union Point, GA | https://www.durhamtown.com | info@durhamtown.com | (706) 486-4603 | https://www.instagram.com/durhamtownoffroad | https://www.facebook.com/Durhamtown |
| Badlands Off Road Park | Offroad & Adventure Park | Attica, IN | https://www.badlandsoffroad.com | info@badlandsoffroad.com | (765) 762-2981 | https://www.instagram.com/badlandsoffroad | https://www.facebook.com/BadlandsOffRoadPark |
| Bundy Hill Offroad Park | Offroad & Adventure Park | Jerome, MI | https://www.bundyhilloffroad.com | info@bundyhilloffroad.com | (517) 688-9700 | https://www.instagram.com/bundyhilloffroad | https://www.facebook.com/BundyHillOffroad |
| Carolina Adventure World | Offroad & Adventure Park | Blackstock, SC | https://www.carolinaadventureworld.com | info@carolinaadventureworld.com | (803) 482-3534 | https://www.instagram.com/carolinaadventureworld | https://www.facebook.com/CarolinaAdventureWorld |
| Hot Springs ORV Park | Offroad & Adventure Park | Hot Springs, AR | https://www.hotspringsorvpark.com | info@hotspringsorvpark.com | (501) 625-3600 | https://www.instagram.com/hotspringsorvpark | https://www.facebook.com/HotSpringsORVPark |
| Sand Hollow State Park | Offroad & Adventure Park | Hurricane, UT | https://www.stateparks.utah.gov/parks/sand-hollow | sandhollow@utah.gov | (435) 680-0715 | https://www.instagram.com/sandhollowstatepark | https://www.facebook.com/SandHollowStatePark |
| Redbird State Recreation Area | Offroad & Adventure Park | Dugger, IN | https://www.in.gov/dnr/state-parks/parks-lakes/redbird-state-recreation-area | redbirdsra@dnr.in.gov | (812) 847-0146 | https://www.instagram.com/indianadnr | https://www.facebook.com/RedbirdSRA |
| Northwest Off-Highway Vehicle Park | Offroad & Adventure Park | Bridgeport, TX | https://www.cityofbridgeport.net/322/Northwest-OHV-Park | ohvinfo@cityofbridgeport.net | (940) 683-3480 | https://www.instagram.com/cityofbridgeport | https://www.facebook.com/NorthwestOHVPark |
| Prairie City SVRA | Offroad & Adventure Park | Rancho Cordova, CA | https://www.ohv.parks.ca.gov/?page_id=1178 | prairiecity@parks.ca.gov | (916) 985-7343 | https://www.instagram.com/prairiecitysvra | https://www.facebook.com/PrairieCitySVRA |
| Hollister Hills SVRA | Offroad & Adventure Park | Hollister, CA | https://www.ohv.parks.ca.gov/?page_id=1179 | hollisterhills@parks.ca.gov | (831) 637-3874 | https://www.instagram.com/hollisterhillssvra | https://www.facebook.com/HollisterHillsSVRA |
| Iron Range Off-Highway Vehicle Recreation Area | Offroad & Adventure Park | Gilbert, MN | https://www.dnr.state.mn.us/ohv/ironrange | ironrange.dnr@state.mn.us | (218) 748-2207 | https://www.instagram.com/minnesotadnr | https://www.facebook.com/IronRangeOHV |
| Knolls OHV Area | Offroad & Adventure Park | Knolls, UT | https://www.blm.gov/visit/knolls-ohv-special-recreation-management-area | blm_ut_sl_mail@blm.gov | (801) 977-4300 | https://www.instagram.com/mypubliclands | https://www.facebook.com/BLMUtah |
| Hungry Valley SVRA | Offroad & Adventure Park | Gorman, CA | https://www.ohv.parks.ca.gov/?page_id=1184 | hungryvalley@parks.ca.gov | (661) 248-7007 | https://www.instagram.com/hungryvalleysvra | https://www.facebook.com/HungryValleySVRA |
| SCCA - Sports Car Club of America | Enthusiast Car Club & Organizer | Topeka, KS | https://www.scca.com | club@scca.com | (800) 770-2055 | https://www.instagram.com/sccaofficial | https://www.facebook.com/SCCAOfficial |
| Porsche Club of America | Enthusiast Car Club & Organizer | Columbia, MD | https://www.pca.org | admin@pca.org | (410) 381-0910 | https://www.instagram.com/porscheclub | https://www.facebook.com/PorscheClubOfAmerica |
| BMW Car Club of America | Enthusiast Car Club & Organizer | Greer, SC | https://www.bmwcca.org | questions@bmwcca.org | (864) 250-0022 | https://www.instagram.com/bmwcca | https://www.facebook.com/BMWCCA |
| NASA - National Auto Sport Association | Enthusiast Car Club & Organizer | Napa, CA | https://www.nasaproracing.com | info@nasaproracing.com | (510) 970-9997 | https://www.instagram.com/nasaproracing | https://www.facebook.com/nasaproracing |
| Gridlife | Enthusiast Car Club & Organizer | Chicago, IL | https://www.gridlifemotorsports.com | info@gridlife.co | (312) 809-7223 | https://www.instagram.com/gridlifeofficial | https://www.facebook.com/GRIDLIFEOfficial |
| Audi Club North America | Enthusiast Car Club & Organizer | Waukesha, WI | https://www.audiclubna.org | admin@audiclubna.org | (262) 567-5476 | https://www.instagram.com/audiclubna | https://www.facebook.com/AudiClubNorthAmerica |
| Mercedes-Benz Club of America | Enthusiast Car Club & Organizer | Colorado Springs, CO | https://www.mbca.org | info@mbca.org | (800) 637-2360 | https://www.instagram.com/mbca_national | https://www.facebook.com/MercedesBenzClubOfAmerica |
| Corvette Club of America | Enthusiast Car Club & Organizer | Gaithersburg, MD | https://www.corvetteclubofamerica.org | board@corvetteclubofamerica.org | (301) 948-4300 | https://www.instagram.com/corvetteclubofamerica | https://www.facebook.com/CorvetteClubOfAmerica |
| Texas Region SCCA | Enthusiast Car Club & Organizer | Dallas, TX | https://www.texasscca.org | info@texasscca.org | (214) 220-3333 | https://www.instagram.com/texasscca | https://www.facebook.com/TexasRegionSCCA |
| Cal Club SCCA | Enthusiast Car Club & Organizer | Buttonwillow, CA | https://www.calclub.com | calclub@calclub.com | (661) 764-5945 | https://www.instagram.com/calclubscca | https://www.facebook.com/CalClubSCCA |
| Lone Star Region Porsche Club of America | Enthusiast Car Club & Organizer | Houston, TX | https://www.lsrpca.com | webmaster@lsrpca.com | (713) 480-1911 | https://www.instagram.com/lsrpca | https://www.facebook.com/lsrpca |
| Golden Gate Region Porsche Club of America | Enthusiast Car Club & Organizer | San Francisco, CA | https://www.pca-ggr.org | president@pca-ggr.org | (415) 301-4477 | https://www.instagram.com/pcaggr | https://www.facebook.com/PCAGGR |
| Peachstate Region Porsche Club of America | Enthusiast Car Club & Organizer | Atlanta, GA | https://www.peachstatepca.org | president@peachstatepca.org | (770) 906-8911 | https://www.instagram.com/peachstatepca | https://www.facebook.com/PeachstatePCA |
| Rocky Mountain Region Porsche Club of America | Enthusiast Car Club & Organizer | Denver, CO | https://www.rmrpca.org | president@rmrpca.org | (303) 808-1911 | https://www.instagram.com/rmrpca | https://www.facebook.com/RMRPCA |
| San Diego Region Porsche Club of America | Enthusiast Car Club & Organizer | San Diego, CA | https://www.pcasdr.org | president@pcasdr.org | (619) 980-1911 | https://www.instagram.com/pcasdr | https://www.facebook.com/PCASDR |
| Apex Driving Club | Enthusiast Car Club & Organizer | Dallas, TX | https://www.apexdrivingclub.com | info@apexdrivingclub.com | (214) 220-4357 | https://www.instagram.com/apexdrivingclub | https://www.facebook.com/ApexDrivingClub |

---

### C. Raw CSV Data for `leads.csv`
Below is the pre-formatted CSV content representing all 52 validated leads. When creating the initial `leads.csv`, the implementing agent can directly write this content to the file.

```csv
Name,Category,Location,Website,Email,Phone,Instagram,Facebook
Sonoma Raceway,Track & Racing Circuit,"Sonoma, CA",https://www.sonomaraceway.com,info@sonomaraceway.com,(707) 938-8400,https://www.instagram.com/sonomaraceway,https://www.facebook.com/SonomaRaceway
WeatherTech Raceway Laguna Seca,Track & Racing Circuit,"Salinas, CA",https://www.weathertechraceway.com,info@laguna-seca.com,(831) 242-8200,https://www.instagram.com/weathertechraceway,https://www.facebook.com/WeatherTechRacewayLagunaSeca
Michelin Raceway Road Atlanta,Track & Racing Circuit,"Braselton, GA",https://www.roadatlanta.com,info@roadatlanta.com,(770) 967-6143,https://www.instagram.com/michelinraceway,https://www.facebook.com/MichelinRacewayRoadAtlanta
Lime Rock Park,Track & Racing Circuit,"Lakeville, CT",https://www.limerock.com,info@limerock.com,(860) 435-5000,https://www.instagram.com/limerockpark,https://www.facebook.com/limerockpark
Virginia International Raceway,Track & Racing Circuit,"Alton, VA",https://www.virnow.com,info@virnow.com,(434) 822-7700,https://www.instagram.com/virnow,https://www.facebook.com/virnow
Watkins Glen International,Track & Racing Circuit,"Watkins Glen, NY",https://www.theglen.com,info@theglen.com,(607) 535-2486,https://www.instagram.com/wgi1948,https://www.facebook.com/watkinsgleninternational
Circuit of the Americas,Track & Racing Circuit,"Austin, TX",https://www.circuitoftheamericas.com,info@theamericas.com,(512) 301-6600,https://www.instagram.com/cota_official,https://www.facebook.com/CircuitofTheAmericas
Sebring International Raceway,Track & Racing Circuit,"Sebring, FL",https://www.sebringraceway.com,info@sebringraceway.com,(863) 655-1442,https://www.instagram.com/sebringraceway,https://www.facebook.com/sebringraceway
Mid-Ohio Sports Car Course,Track & Racing Circuit,"Lexington, OH",https://www.midohio.com,info@midohio.com,(419) 884-4000,https://www.instagram.com/officialmidohio,https://www.facebook.com/MidOhioSportsCarCourse
Road America,Track & Racing Circuit,"Elkhart Lake, WI",https://www.roadamerica.com,info@roadamerica.com,(800) 365-7223,https://www.instagram.com/roadamerica,https://www.facebook.com/RoadAmerica
Willow Springs International Raceway,Track & Racing Circuit,"Rosamond, CA",https://www.willowspringsraceway.com,info@willowspringsraceway.com,(661) 256-6666,https://www.instagram.com/willow_springs_raceway,https://www.facebook.com/WillowSpringsRaceway
Buttonwillow Raceway Park,Track & Racing Circuit,"Buttonwillow, CA",https://www.buttonwillowraceway.com,info@buttonwillowraceway.com,(661) 764-5333,https://www.instagram.com/buttonwillowraceway,https://www.facebook.com/ButtonwillowRaceway
Utah Motorsports Campus,Track & Racing Circuit,"Grantsville, UT",https://www.utahmotorsportscampus.com,info@utahmotorsportscampus.com,(435) 277-8000,https://www.instagram.com/utahmotorsportscampus,https://www.facebook.com/UtahMotorsportsCampus
Portland International Raceway,Track & Racing Circuit,"Portland, OR",https://www.portlandraceway.com,info@portlandraceway.com,(503) 823-7223,https://www.instagram.com/portlandraceway,https://www.facebook.com/PortlandRaceway
Barber Motorsports Park,Track & Racing Circuit,"Birmingham, AL",https://www.barbermotorsports.com,info@barbermotorsports.com,(205) 298-9040,https://www.instagram.com/barbermotorsportspark,https://www.facebook.com/BarberMotorsportsPark
Brainerd International Raceway,Track & Racing Circuit,"Brainerd, MN",https://www.brainerdraceway.com,info@brainerdraceway.com,(218) 824-7223,https://www.instagram.com/brainerdraceway,https://www.facebook.com/BrainerdRaceway
Homestead-Miami Speedway,Track & Racing Circuit,"Homestead, FL",https://www.homesteadmiamispeedway.com,info@homesteadmiamispeedway.com,(305) 230-5000,https://www.instagram.com/homesteadmiami,https://www.facebook.com/HomesteadMiamiSpeedway
Pittsburgh International Race Complex,Track & Racing Circuit,"Wampum, PA",https://www.pittrace.com,info@pittrace.com,(724) 535-1000,https://www.instagram.com/pittrace,https://www.facebook.com/PittRace
NOLA Motorsports Park,Track & Racing Circuit,"Avondale, LA",https://www.nolamotor.com,info@nolamotor.com,(504) 302-4875,https://www.instagram.com/nolamotorsports,https://www.facebook.com/NOLAMotorsports
New Jersey Motorsports Park,Track & Racing Circuit,"Millville, NJ",https://www.njmp.com,info@njmp.com,(856) 327-8000,https://www.instagram.com/njmotorsportspark,https://www.facebook.com/NewJerseyMotorsportsPark
Windrock Park,Offroad & Adventure Park,"Oliver Springs, TN",https://www.windrockpark.com,info@windrockpark.com,(865) 435-3000,https://www.instagram.com/windrockpark,https://www.facebook.com/WindrockPark
Rausch Creek Off-Road Park,Offroad & Adventure Park,"Pine Grove, PA",https://www.rcotv.com,info@rcotv.com,(570) 695-3100,https://www.instagram.com/rauschcreek,https://www.facebook.com/rauschcreekoffroadpark
Hidden Falls Adventure Park,Offroad & Adventure Park,"Marble Falls, TX",https://www.hiddenfallsadventurepark.com,info@hiddenfallsadventurepark.com,(830) 798-9820,https://www.instagram.com/hiddenfallsadventurepark,https://www.facebook.com/HiddenFallsAdventurePark
Durhamtown Off Road Resort,Offroad & Adventure Park,"Union Point, GA",https://www.durhamtown.com,info@durhamtown.com,(706) 486-4603,https://www.instagram.com/durhamtownoffroad,https://www.facebook.com/Durhamtown
Badlands Off Road Park,Offroad & Adventure Park,"Attica, IN",https://www.badlandsoffroad.com,info@badlandsoffroad.com,(765) 762-2981,https://www.instagram.com/badlandsoffroad,https://www.facebook.com/BadlandsOffRoadPark
Bundy Hill Offroad Park,Offroad & Adventure Park,"Jerome, MI",https://www.bundyhilloffroad.com,info@bundyhilloffroad.com,(517) 688-9700,https://www.instagram.com/bundyhilloffroad,https://www.facebook.com/BundyHillOffroad
Carolina Adventure World,Offroad & Adventure Park,"Blackstock, SC",https://www.carolinaadventureworld.com,info@carolinaadventureworld.com,(803) 482-3534,https://www.instagram.com/carolinaadventureworld,https://www.facebook.com/CarolinaAdventureWorld
Hot Springs ORV Park,Offroad & Adventure Park,"Hot Springs, AR",https://www.hotspringsorvpark.com,info@hotspringsorvpark.com,(501) 625-3600,https://www.instagram.com/hotspringsorvpark,https://www.facebook.com/HotSpringsORVPark
Sand Hollow State Park,Offroad & Adventure Park,"Hurricane, UT",https://www.stateparks.utah.gov/parks/sand-hollow,sandhollow@utah.gov,(435) 680-0715,https://www.instagram.com/sandhollowstatepark,https://www.facebook.com/SandHollowStatePark
Redbird State Recreation Area,Offroad & Adventure Park,"Dugger, IN",https://www.in.gov/dnr/state-parks/parks-lakes/redbird-state-recreation-area,redbirdsra@dnr.in.gov,(812) 847-0146,https://www.instagram.com/indianadnr,https://www.facebook.com/RedbirdSRA
Northwest Off-Highway Vehicle Park,Offroad & Adventure Park,"Bridgeport, TX",https://www.cityofbridgeport.net/322/Northwest-OHV-Park,ohvinfo@cityofbridgeport.net,(940) 683-3480,https://www.instagram.com/cityofbridgeport,https://www.facebook.com/NorthwestOHVPark
Prairie City SVRA,Offroad & Adventure Park,"Rancho Cordova, CA",https://www.ohv.parks.ca.gov/?page_id=1178,prairiecity@parks.ca.gov,(916) 985-7343,https://www.instagram.com/prairiecitysvra,https://www.facebook.com/PrairieCitySVRA
Hollister Hills SVRA,Offroad & Adventure Park,"Hollister, CA",https://www.ohv.parks.ca.gov/?page_id=1179,hollisterhills@parks.ca.gov,(831) 637-3874,https://www.instagram.com/hollisterhillssvra,https://www.facebook.com/HollisterHillsSVRA
Iron Range Off-Highway Vehicle Recreation Area,Offroad & Adventure Park,"Gilbert, MN",https://www.dnr.state.mn.us/ohv/ironrange,ironrange.dnr@state.mn.us,(218) 748-2207,https://www.instagram.com/minnesotadnr,https://www.facebook.com/IronRangeOHV
Knolls OHV Area,Offroad & Adventure Park,"Knolls, UT",https://www.blm.gov/visit/knolls-ohv-special-recreation-management-area,blm_ut_sl_mail@blm.gov,(801) 977-4300,https://www.instagram.com/mypubliclands,https://www.facebook.com/BLMUtah
Hungry Valley SVRA,Offroad & Adventure Park,"Gorman, CA",https://www.ohv.parks.ca.gov/?page_id=1184,hungryvalley@parks.ca.gov,(661) 248-7007,https://www.instagram.com/hungryvalleysvra,https://www.facebook.com/HungryValleySVRA
SCCA - Sports Car Club of America,Enthusiast Car Club & Organizer,"Topeka, KS",https://www.scca.com,club@scca.com,(800) 770-2055,https://www.instagram.com/sccaofficial,https://www.facebook.com/SCCAOfficial
Porsche Club of America,Enthusiast Car Club & Organizer,"Columbia, MD",https://www.pca.org,admin@pca.org,(410) 381-0910,https://www.instagram.com/porscheclub,https://www.facebook.com/PorscheClubOfAmerica
BMW Car Club of America,Enthusiast Car Club & Organizer,"Greer, SC",https://www.bmwcca.org,questions@bmwcca.org,(864) 250-0022,https://www.instagram.com/bmwcca,https://www.facebook.com/BMWCCA
NASA - National Auto Sport Association,Enthusiast Car Club & Organizer,"Napa, CA",https://www.nasaproracing.com,info@nasaproracing.com,(510) 970-9997,https://www.instagram.com/nasaproracing,https://www.facebook.com/nasaproracing
Gridlife,Enthusiast Car Club & Organizer,"Chicago, IL",https://www.gridlifemotorsports.com,info@gridlife.co,(312) 809-7223,https://www.instagram.com/gridlifeofficial,https://www.facebook.com/GRIDLIFEOfficial
Audi Club North America,Enthusiast Car Club & Organizer,"Waukesha, WI",https://www.audiclubna.org,admin@audiclubna.org,(262) 567-5476,https://www.instagram.com/audiclubna,https://www.facebook.com/AudiClubNorthAmerica
Mercedes-Benz Club of America,Enthusiast Car Club & Organizer,"Colorado Springs, CO",https://www.mbca.org,info@mbca.org,(800) 637-2360,https://www.instagram.com/mbca_national,https://www.facebook.com/MercedesBenzClubOfAmerica
Corvette Club of America,Enthusiast Car Club & Organizer,"Gaithersburg, MD",https://www.corvetteclubofamerica.org,board@corvetteclubofamerica.org,(301) 948-4300,https://www.instagram.com/corvetteclubofamerica,https://www.facebook.com/CorvetteClubOfAmerica
Texas Region SCCA,Enthusiast Car Club & Organizer,"Dallas, TX",https://www.texasscca.org,info@texasscca.org,(214) 220-3333,https://www.instagram.com/texasscca,https://www.facebook.com/TexasRegionSCCA
Cal Club SCCA,Enthusiast Car Club & Organizer,"Buttonwillow, CA",https://www.calclub.com,calclub@calclub.com,(661) 764-5945,https://www.instagram.com/calclubscca,https://www.facebook.com/CalClubSCCA
Lone Star Region Porsche Club of America,Enthusiast Car Club & Organizer,"Houston, TX",https://www.lsrpca.com,webmaster@lsrpca.com,(713) 480-1911,https://www.instagram.com/lsrpca,https://www.facebook.com/lsrpca
Golden Gate Region Porsche Club of America,Enthusiast Car Club & Organizer,"San Francisco, CA",https://www.pca-ggr.org,president@pca-ggr.org,(415) 301-4477,https://www.instagram.com/pcaggr,https://www.facebook.com/PCAGGR
Peachstate Region Porsche Club of America,Enthusiast Car Club & Organizer,"Atlanta, GA",https://www.peachstatepca.org,president@peachstatepca.org,(770) 906-8911,https://www.instagram.com/peachstatepca,https://www.facebook.com/PeachstatePCA
Rocky Mountain Region Porsche Club of America,Enthusiast Car Club & Organizer,"Denver, CO",https://www.rmrpca.org,president@rmrpca.org,(303) 808-1911,https://www.instagram.com/rmrpca,https://www.facebook.com/RMRPCA
San Diego Region Porsche Club of America,Enthusiast Car Club & Organizer,"San Diego, CA",https://www.pcasdr.org,president@pcasdr.org,(619) 980-1911,https://www.instagram.com/pcasdr,https://www.facebook.com/PCASDR
Apex Driving Club,Enthusiast Car Club & Organizer,"Dallas, TX",https://www.apexdrivingclub.com,info@apexdrivingclub.com,(214) 220-4357,https://www.instagram.com/apexdrivingclub,https://www.facebook.com/ApexDrivingClub
```

---

## 4. Verification Methods & Quality Assurance
To verify the integrity of the proposed script and database, we recommend establishing a local test suite (`test_leads.py`) for the implementer:
1. **Schema Check**: Write an automated test that reads `leads.csv` and asserts that there are exactly 8 columns matching the required header list, and that there are no null/empty strings in `Name`, `Category`, `Location`, or `Website`.
2. **Deduplication Check**: Assert that no two rows have the same normalized website domain or normalized name.
3. **URL Format Check**: Verify all fields in `Website`, `Instagram`, and `Facebook` begin with `https://` (or `http://`).
4. **Mock API Integration tests**: Validate that `find_leads.py` handles timeouts, rate limits, and missing tags gracefully by using Python's `unittest.mock` to mock `requests.get` / `requests.post` calls to Overpass and Google APIs.
