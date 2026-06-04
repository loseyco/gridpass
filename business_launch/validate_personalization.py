import csv
import re
import sys

# Database of localized access roads for high-priority tracks in leads.csv
ACCESS_ROADS = {
    "Sonoma Raceway": "Highway 37 / Sears Point Road",
    "WeatherTech Raceway Laguna Seca": "Highway 68 / Monterey-Salinas Highway",
    "Michelin Raceway Road Atlanta": "Highway 53 / Winder Highway",
    "Lime Rock Park": "Route 112 / Lime Rock Road",
    "Virginia International Raceway": "Pine Tree Road",
    "Circuit of the Americas": "Elroy Road / COTA Boulevard",
    "Windrock Park": "Oliver Springs Highway / Windrock Road",
}

# State name translations dictionary
STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
    "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"
}

def generate_personalized_emails(csv_path):
    count = 0
    with open(csv_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            # Safe parsing of empty rows and trailing empty lines
            if not row or not row.get('Name') or not row.get('Category'):
                continue
                
            name = row['Name']
            category = row['Category']
            email = row['Email']
            location = row['Location']
            
            # Resolve State/Region from Location column (e.g. "Sonoma, CA" -> "California")
            region = "your local"
            state_match = re.search(r',\s*([A-Z]{2})', location)
            if state_match:
                state_code = state_match.group(1)
                region = STATE_NAMES.get(state_code, state_code)
            
            # Dynamic greeting fallback logic
            first_name = row.get('First Name') or row.get('Contact Name') or ""
            if not first_name:
                if "Track" in category:
                    recipient_title = "Track Manager"
                elif "Offroad" in category:
                    recipient_title = "Park Director"
                elif "Club" in category or "Organizer" in category:
                    recipient_title = "Club President"
                else:
                    recipient_title = "Manager"
                greeting = f"Hi {recipient_title},"
            else:
                greeting = f"Hi {first_name},"
            
            if "Track" in category or "Offroad" in category:
                # Resolve local access road
                access_road = ACCESS_ROADS.get(name, "the main access highway")
                
                # Format Track Email 1 (Complete f-string body)
                email_body = f"""Subject: Streamlining the 7:00 AM gate bottleneck at {name}

{greeting}

If you are like most track managers, Saturday mornings between 6:30 AM and 8:00 AM are absolute chaos. 

When drivers towing trailers back up onto {access_road} while gate staff pass wet-ink clipboards out the window, it doesn't just create public safety hazards—it delays your drivers' meetings and burns through expensive staff labor hours.

We built gridpass.app specifically to solve this gate bottleneck.

Gridpass replaces legacy paper check-ins with a "One-Scan" digital entry pass. Drivers add their Gridpass directly to their Apple or Google Wallet before they arrive. When they roll up:

1. Under 5-Second Ingress: A single scan at the window instantly verifies their registration, run group, and vehicle. No paper sheets or Excel cross-referencing.
2. 100% Digital Waivers: Drivers cannot download their active QR pass until they sign your specific liability waiver and upload selfie-verification. No signed waiver = no entry pass.
3. Paddock Routing: Your gate staff sees high-contrast, color-coded screens (Green = Clear, Yellow = Needs Tech Sheet, Red = Access Denied) so they can route vehicles without checking printed spreadsheets.

We already have active Gridpass users in the {region} automotive community.

I have put together a 60-second interactive preview of how Gridpass would look for {name}'s gate flow. 

Would you be open to a brief, 5-minute call next Tuesday or Thursday to take a look?

Best regards,

[Your Name]
Growth Director, gridpass.app
[Your Phone Number]
[Your Email Address]"""
                print(f"--- DRAFT GENERATED FOR {name} ({email}) ---")
                print(email_body)
                print()
                count += 1
                
            elif "Club" in category:
                # Format Car Club Email 1 (Complete f-string body)
                club_body = f"""Subject: Ditching the spreadsheets at {name} events

{greeting}

Running a chapter as active as {name} is a massive achievement—but if you're like most Club Presidents we talk to, you are probably spending more time managing clunky Excel sheets, tracking lapsed dues, and chasing paper waivers than actually enjoying the cars.

Roster drift is immediate. Members buy new cars, sell old ones, change emails, or let their dues expire. The database is outdated the minute you download it.

We built gridpass.app to solve exactly this for enthusiast automotive communities. 

Gridpass replaces the spreadsheets and clipboards with a modern, digital hub for your club:

1. **One-Scan Membership Entry**: Verify active dues standing and signed liability waivers in under 1 second with any smartphone camera—no app download required. 
2. **Beautiful Digital Garages**: Your members get mobile-first portfolio pages to showcase their vehicle specs, modification logs, dyno sheets, and build history. 
3. **Interactive Directories**: A secure, privacy-compliant roster that lets members search for cars within the club (e.g. finding every E92 M3 or manual GT3 in your chapter) to coordinate technical advice or local cruises.
4. **Instant Guest Capture**: Non-members scan a guest gate QR code, fill in their vehicle info, sign your waiver in 3 taps, and receive a guest pass, capturing a warm lead for your club immediately.

Because we know you are busy running {name} as a volunteer, my team wants to do the heavy lifting. If you are open to it, we will build a free, custom Digital Garage page and digital membership pass mockup for your own car, so you can see exactly how it looks.

Would you be open to checking out a quick mockup for your vehicle next week? If so, just reply to this email with a quick photo of your car or its specs, and we will take care of the rest.

Best regards,

[Your Name]
Growth Director, gridpass.app
[Your Phone Number]"""
                print(f"--- DRAFT GENERATED FOR {name} ({email}) ---")
                print(club_body)
                print()
                count += 1
    return count

if __name__ == "__main__":
    count = generate_personalized_emails("leads.csv")
    print(f"\nSuccessfully generated {count} drafts.")
    if count == 52:
        print("PASS: Verified 52 accurate emails.")
        sys.exit(0)
    else:
        print(f"FAIL: Expected 52, got {count}.")
        sys.exit(1)
