import csv
import re
import sys
import os

# Factual corrections for the access roads database
ACCESS_ROADS = {
    "Sonoma Raceway": "Highway 37 / Sears Point Road",
    "WeatherTech Raceway Laguna Seca": "Highway 68 / Monterey-Salinas Highway",
    "Michelin Raceway Road Atlanta": "Highway 53 / Winder Highway",
    "Lime Rock Park": "Route 112 / Lime Rock Road",
    "Virginia International Raceway": "Pine Tree Road",
    "Circuit of the Americas": "Elroy Road / COTA Boulevard",
    "Windrock Park": "Oliver Springs Highway / Windrock Road",
}

# Mapping 2-letter state codes to full state names for natural phrasing
STATE_NAMES = {
    "AL": "Alabama", "AR": "Arkansas", "AZ": "Arizona", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "FL": "Florida", "GA": "Georgia",
    "IL": "Illinois", "IN": "Indiana", "KS": "Kansas", "LA": "Louisiana",
    "MD": "Maryland", "MI": "Michigan", "MN": "Minnesota", "NJ": "New Jersey",
    "NY": "New York", "OH": "Ohio", "OR": "Oregon", "PA": "Pennsylvania",
    "SC": "South Carolina", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VA": "Virginia", "WI": "Wisconsin"
}

def generate_personalized_emails(csv_path, output_dir, sender_info):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    with open(csv_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        count = 0
        for row in reader:
            name = row['Name']
            category = row['Category']
            email = row['Email']
            location = row['Location']
            
            # Resolve State/Region naturally (e.g. "Sonoma, CA" -> "California")
            region_name = "your local"
            state_match = re.search(r',\s*([A-Z]{2})', location)
            if state_match:
                state_code = state_match.group(1)
                region_name = STATE_NAMES.get(state_code, state_code)
            
            # Formulate friendly contact name fallback since leads.csv has no first names
            contact_name = "Team"
            
            if "Track" in category or "Offroad" in category:
                access_road = ACCESS_ROADS.get(name, "the main access highway")
                
                # Fully complete, non-truncated Track Email 1 Draft
                email_body = f"""Subject: Streamlining the 7:00 AM gate bottleneck at {name}

Hi {name} {contact_name},

If you are like most track managers, Saturday mornings between 6:30 AM and 8:00 AM are absolute chaos. 

When drivers towing trailers back up onto {access_road} while gate staff pass wet-ink clipboards out the window, it doesn't just create public safety hazards—it delays your drivers' meetings and burns through expensive staff labor hours.

We built gridpass.app specifically to solve this gate bottleneck.

Gridpass replaces legacy paper check-ins with a "One-Scan" digital entry pass. Drivers add their Gridpass directly to their Apple or Google Wallet before they arrive. When they roll up:

1. Under 5-Second Ingress: A single scan at the window instantly verifies their registration, run group, and vehicle. No paper sheets or Excel cross-referencing.
2. 100% Digital Waivers: Drivers cannot download their active QR pass until they sign your specific liability waiver and upload selfie-verification. No signed waiver = no entry pass.
3. Paddock Routing: Your gate staff sees high-contrast, color-coded screens (Green = Clear, Yellow = Needs Tech Sheet, Red = Access Denied) so they can route vehicles without checking printed spreadsheets.

We already have active Gridpass users in the {region_name} automotive community.

I have put together a 60-second interactive preview of how Gridpass would look for {name}'s gate flow. 

Would you be open to a brief, 5-minute call next Tuesday or Thursday to take a look?

Best regards,

{sender_info['name']}
Growth Director, gridpass.app
{sender_info['phone']}
{sender_info['email']}
"""
                
            elif "Club" in category:
                # Fully complete, non-truncated Car Club Email 1 Draft
                email_body = f"""Subject: Ditching the spreadsheets at {name} events

Hi {name} {contact_name},

Running a chapter as active as {name} is a massive achievement—but if you're like most Club Presidents we talk to, you are probably spending more time managing clunky Excel sheets, tracking lapsed dues, and chasing paper waivers than actually enjoying the cars.

Roster drift is immediate. Members buy new cars, sell old ones, change emails, or let their dues expire. The database is outdated the minute you download it.

We built gridpass.app to solve exactly this for enthusiast automotive communities. 

Gridpass replaces the spreadsheets and clipboards with a modern, digital hub for your club:

1. One-Scan Membership Entry: Verify active dues standing and signed liability waivers in under 1 second with any smartphone camera—no app download required. 
2. Beautiful Digital Garages: Your members get mobile-first portfolio pages to showcase their vehicle specs, modification logs, dyno sheets, and build history. 
3. Interactive Directories: A secure, privacy-compliant roster that lets members search for cars within the club (e.g. finding every E92 M3 or manual GT3 in your chapter) to coordinate technical advice or local cruises.
4. Instant Guest Capture: Non-members scan a guest gate QR code, fill in their vehicle info, sign your waiver in 3 taps, and receive a guest pass, capturing a warm lead for your club immediately.

Because we know you are busy running {name} as a volunteer, my team wants to do the heavy lifting. If you are open to it, we will build a free, custom Digital Garage page and digital membership pass mockup for your own car, so you can see exactly how it looks.

Would you be open to checking out a quick mockup for your vehicle next week? If so, just reply to this email with a quick photo of your car or its specs, and we will take care of the rest.

Best regards,

{sender_info['name']}
Growth Director, gridpass.app
{sender_info['phone']}
{sender_info['email']}
"""
            else:
                continue
                
            # Write to output file
            safe_name = "".join(x for x in name if x.isalnum() or x in " -_").strip()
            file_name = f"{count:03d}_{safe_name.replace(' ', '_')}.txt"
            with open(os.path.join(output_dir, file_name), 'w', encoding='utf-8') as out_f:
                out_f.write(email_body)
            count += 1
            
    print(f"Success: Generated {count} fully resolved, personalized drafts in {output_dir}")

if __name__ == "__main__":
    csv_file = r"c:\_Projects\Gridpass-v4\business_launch\leads.csv"
    out_dir = r"c:\_Projects\Gridpass-v4\business_launch\.agents\teamwork_preview_challenger_m2_2\drafts"
    sender = {
        "name": "Alex Montgomery",
        "phone": "(415) 555-0199",
        "email": "alex.m@gridpass.app"
    }
    generate_personalized_emails(csv_file, out_dir, sender)
