import time
import json
import random
import os
from datetime import datetime

# CONFIGURATION
RESULTS_DIR = r"C:\Users\pjlos\Documents\iRacing\results"

def generate_result():
    timestamp = datetime.now().isoformat()
    subsession_id = random.randint(100000, 999999)
    
    # Random finishing results
    drivers = [
        {"cust_id": 12345, "display_name": "Max Verstappen", "irating": 9000},
        {"cust_id": 67890, "display_name": "Charles Leclerc", "irating": 8500},
        {"cust_id": 11223, "display_name": "Lando Norris", "irating": 8400},
        {"cust_id": 99999, "display_name": "PJ Losey", "irating": 4200}, # You
        {"cust_id": 44444, "display_name": "Lewis Hamilton", "irating": 8000},
    ]
    random.shuffle(drivers)
    
    formatted_results = []
    for i, d in enumerate(drivers):
        formatted_results.append({
            "cust_id": d["cust_id"],
            "display_name": d["display_name"],
            "finish_position": i,
            "starting_position": random.randint(0, 4),
            "laps_complete": 50,
            "best_lap_time": 105123,
            "average_lap_time": 106000,
            "incidents": random.randint(0, 8),
            "old_irating": d["irating"],
            "new_irating": d["irating"] + random.randint(-50, 50)
        })

    data = {
        "subsession_id": subsession_id,
        "start_time": timestamp,
        "track": {
            "track_id": 1,
            "track_name": "Daytona International Speedway",
            "track_config_name": "Road Course"
        },
        "session_results": [
             {
                 "simsession_number": 0,
                 "simsession_type": 6,
                 "simsession_type_name": "Race",
                 "simsession_subtype": 0,
                 "simsession_name": "RACE",
                 "results": formatted_results
             }
        ]
    }
    
    filename = f"subsession_{subsession_id}.json"
    filepath = os.path.join(RESULTS_DIR, filename)
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)
        
    print(f"✅ Generated race result: {filepath}")

if __name__ == "__main__":
    if not os.path.exists(RESULTS_DIR):
        os.makedirs(RESULTS_DIR)
        
    print("🏎️  Simulating iRacing races...")
    try:
        while True:
            generate_result()
            print("Waiting 30 seconds for next race...")
            time.sleep(30)
    except KeyboardInterrupt:
        print("Stopped.")
