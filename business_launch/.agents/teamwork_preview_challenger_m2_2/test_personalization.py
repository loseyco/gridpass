import csv
import re
import sys

# Database of localized access roads for high-priority tracks in leads.csv
ACCESS_ROADS = {
    "Sonoma Raceway": "Highway 37 / Crows Landing Road",
    "WeatherTech Raceway Laguna Seca": "Highway 68 / Monterey-Salinas Highway",
    "Michelin Raceway Road Atlanta": "Highway 53 / Winder Highway",
    "Lime Rock Park": "Highway 112 / Salmon Fell Road",
    "Virginia International Raceway": "Birch Creek Road",
    "Circuit of the Americas": "Elroy Road / COTA Boulevard",
    "Windrock Park": "Oliver Springs Highway / Windrock Road",
}

def generate_personalized_emails(csv_path):
    with open(csv_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            name = row['Name']
            category = row['Category']
            email = row['Email']
            location = row['Location']
            
            # Resolve State/Region from Location column (e.g. "Sonoma, CA" -> "California")
            region = "your local"
            state_match = re.search(r',\s*([A-Z]{2})', location)
            if state_match:
                state_code = state_match.group(1)
                region = f"{state_code}"
            
            if "Track" in category or "Offroad" in category:
                # Resolve local access road
                access_road = ACCESS_ROADS.get(name, "the main access highway")
                
                # Format Track Email 1
                email_body = f"""
Subject: Streamlining the 7:00 AM gate bottleneck at {name}

Hi [First Name],

If you are like most track managers, Saturday mornings between 6:30 AM and 8:00 AM are absolute chaos. 

When drivers towing trailers back up onto {access_road} while gate staff pass wet-ink clipboards out the window, it doesn't just create public safety hazards—it delays your drivers' meetings and burns through expensive staff labor hours.

We built gridpass.app specifically to solve this gate bottleneck for venues in the {region} region...
"""
                print(f"--- DRAFT GENERATED FOR {name} ({email}) ---")
                print(email_body)
                
            elif "Club" in category:
                # Format Car Club Email 1
                club_body = f"""
Subject: Ditching the spreadsheets at {name} events

Hi [First Name],

Running a chapter as active as {name} is a massive achievement—but if you're like most Club Presidents we talk to, you are probably spending more time managing clunky Excel sheets, tracking lapsed dues, and chasing paper waivers than actually enjoying the cars...
"""
                print(f"--- DRAFT GENERATED FOR {name} ({email}) ---")
                print(club_body)

if __name__ == "__main__":
    csv_file = r"c:\_Projects\Gridpass-v4\business_launch\leads.csv"
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
    print(f"Running personalization script on: {csv_file}")
    generate_personalized_emails(csv_file)
