import csv
import re
import os

# Complete database of localized access roads for all tracks/offroad parks in leads.csv
ACCESS_ROADS = {
    # Original list
    "Sonoma Raceway": "Highway 37 / Crows Landing Road",
    "WeatherTech Raceway Laguna Seca": "Highway 68 / Monterey-Salinas Highway",
    "Michelin Raceway Road Atlanta": "Highway 53 / Winder Highway",
    "Lime Rock Park": "Highway 112 / Salmon Fell Road",
    "Virginia International Raceway": "Birch Creek Road",
    "Circuit of the Americas": "Elroy Road / COTA Boulevard",
    "Windrock Park": "Oliver Springs Highway / Windrock Road",
    
    # Researched additions to cover all tracks and offroad parks in leads.csv
    "Watkins Glen International": "County Route 16",
    "Sebring International Raceway": "Sebring Parkway / Carroll Shelby Way",
    "Mid-Ohio Sports Car Course": "Steam Corners Road",
    "Road America": "State Highway 67",
    "Willow Springs International Raceway": "Rosamond Boulevard",
    "Buttonwillow Raceway Park": "Lerdo Highway",
    "Utah Motorsports Campus": "Sheep Lane",
    "Portland International Raceway": "Broadacre Road / Victory Boulevard",
    "Barber Motorsports Park": "Barber Motorsports Parkway",
    "Brainerd International Raceway": "State Highway 371",
    "Homestead-Miami Speedway": "Ralph Sanchez Speedway Boulevard",
    "Pittsburgh International Race Complex": "Penndale Road",
    "NOLA Motorsports Park": "Nicolle Boulevard",
    "New Jersey Motorsports Park": "Dividing Creek Road / Warbird Drive",
    "Rausch Creek Off-Road Park": "Rausch Creek Road",
    "Hidden Falls Adventure Park": "Park Road 4",
    "Durhamtown Off Road Resort": "Randolph Road",
    "Badlands Off Road Park": "Market Street",
    "Bundy Hill Offroad Park": "Bundy Hill Road",
    "Carolina Adventure World": "Carolina Adventure World Way",
    "Hot Springs ORV Park": "Mill Creek Road",
    "Sand Hollow State Park": "Sand Hollow Road",
    "Redbird State Recreation Area": "County Road 350 N",
    "Northwest Off-Highway Vehicle Park": "Bridgeport Road",
    "Prairie City SVRA": "White Rock Road",
    "Hollister Hills SVRA": "Cienega Road",
    "Iron Range Off-Highway Vehicle Recreation Area": "Highway 135",
    "Knolls OHV Area": "Knolls Road",
    "Hungry Valley SVRA": "Gold Hill Road"
}

def generate_personalized_emails(csv_path, output_path):
    drafts = []
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return
        
    with open(csv_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        row_count = 0
        for row in reader:
            row_count += 1
            # Gracefully handle blank rows or missing headers
            if not row or not any(row.values()):
                print(f"Row {row_count}: Skipping blank row.")
                continue
                
            name = row.get('Name', '').strip()
            category = row.get('Category', '').strip()
            email = row.get('Email', '').strip()
            location = row.get('Location', '').strip()
            
            if not name or not category:
                print(f"Row {row_count}: Missing essential fields Name or Category. Skipping.")
                continue
                
            # Resolve State/Region from Location column (e.g. "Sonoma, CA" -> "CA")
            region = "your local"
            if location:
                state_match = re.search(r',\s*([A-Z]{2})', location)
                if state_match:
                    region = state_match.group(1)
            
            # Resolve recipient name since first name is missing in leads.csv
            recipient_title = "Track Manager"
            if "Club" in category:
                recipient_title = "Club President"
            elif "Offroad" in category:
                recipient_title = "Park Director"
                
            if "Track" in category or "Offroad" in category:
                # Resolve local access road
                access_road = ACCESS_ROADS.get(name, "the main access highway")
                
                # Format Track Email 1 (fully complete, mapping all placeholder tokens)
                email_body = f"""--- DRAFT GENERATED FOR {name} ({email}) ---
Subject: Streamlining the 7:00 AM gate bottleneck at {name}

Hi {recipient_title},

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

Alex Mercer
Growth Director, gridpass.app
(555) 019-2834
alex.mercer@gridpass.app
----------------------------------------------
"""
                drafts.append(email_body)
                
            elif "Club" in category:
                # Format Car Club Email 1
                club_body = f"""--- DRAFT GENERATED FOR {name} ({email}) ---
Subject: Ditching the spreadsheets at {name} events

Hi {recipient_title},

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

Alex Mercer
Growth Director, gridpass.app
(555) 019-2834
alex.mercer@gridpass.app
----------------------------------------------
"""
                drafts.append(club_body)
                
    with open(output_path, mode='w', encoding='utf-8') as outfile:
        outfile.writelines(drafts)
        
    print(f"Successfully processed {row_count} rows and generated {len(drafts)} drafts at {output_path}")

if __name__ == "__main__":
    generate_personalized_emails(
        "c:\\_Projects\\Gridpass-v4\\business_launch\\leads.csv", 
        "c:\\_Projects\\Gridpass-v4\\business_launch\\.agents\\teamwork_preview_challenger_m2_1\\draft_emails.txt"
    )
