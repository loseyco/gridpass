import time
import os
import sys
import json
import requests
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# CONFIGURATION
API_URL = "http://localhost:3000/api/league/ingest" # Update to localhost for testing
API_TOKEN = "f21010" # We will generate one
WATCH_DIR = r"C:\Users\pjlos\Documents\iRacing\results" # Standard iRacing path

class ResultHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith('.json'):
            print(f"New result found: {event.src_path}")
            time.sleep(1) # Wait for file write to complete
            self.upload_result(event.src_path)

    def upload_result(self, filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            headers = {
                "Authorization": f"Bearer {API_TOKEN}",
                "Content-Type": "application/json"
            }
            
            print("Uploading to GridPass...")
            response = requests.post(API_URL, json=data, headers=headers)
            
            if response.status_code == 200:
                print("✅ Upload Successful!")
            else:
                print(f"❌ Upload Failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"Error processing file: {e}")

if __name__ == "__main__":
    # Ensure directory exists
    if not os.path.exists(WATCH_DIR):
        print(f"Directory not found: {WATCH_DIR}")
        print("Please edit the script to point to your iRacing results folder.")
        # sys.exit(1) # Don't exit, just warn for now so user can see it
        WATCH_DIR = "." # Fallback

    event_handler = ResultHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_DIR, recursive=False)
    observer.start()
    
    print(f"👀 Watching for iRacing results in: {WATCH_DIR}")
    print("Press Ctrl+C to stop.")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
