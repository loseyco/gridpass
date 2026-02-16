
import os
import requests
import zipfile
import io
import shutil
import time
import config
from datetime import datetime

# URL to check for updates
VERSION_URL = f"{config.API_BASE_URL.replace('/api', '')}/version.txt"
ZIP_URL = f"{config.API_BASE_URL.replace('/api', '')}/client.zip"
LOCAL_VERSION_FILE = "version.txt"

def check_for_updates():
    print(f"Update Check: {VERSION_URL}")
    try:
        # Get remote version
        try:
            resp = requests.get(VERSION_URL, timeout=5)
            if resp.status_code != 200:
                print(f"⚠️  Update server unavailable (HTTP {resp.status_code})")
                return
            remote_version = resp.text.strip()
        except Exception as e:
            print(f"⚠️  Could not check for updates: {e}")
            return

        # Get local version
        local_version = "0"
        if os.path.exists(LOCAL_VERSION_FILE):
            with open(LOCAL_VERSION_FILE, "r") as f:
                local_version = f.read().strip()

        print(f"Versions: Local={local_version}, Remote={remote_version}")

        if remote_version != local_version:
            print(f"🚀 New version found! updating...")
            update_client(remote_version)
        else:
            print("✓ Client is up to date")

    except Exception as e:
        print(f"Error checking updates: {e}")

def update_client(new_version):
    try:
        print(f"Downloading update from {ZIP_URL}...")
        resp = requests.get(ZIP_URL, stream=True)
        if resp.status_code != 200:
            print("Failed to download update.")
            return

        # Backup config
        has_config = os.path.exists("config.py")
        if has_config:
            shutil.copy("config.py", "config.py.bak")
            print("Backed up config.py")

        # Extract
        z = zipfile.ZipFile(io.BytesIO(resp.content))
        # Filter files? No, just overwrite everything (except maybe config if we handle it)
        # But we want to preserve config.py if it's customized.
        
        # We can extract to temp folder then copy over?
        # Or extract directly and restore config.
        
        print("Extracting files...")
        z.extractall(".")
        
        # Restore config if needed
        # Actually, extracting might overwrite config.py with the one from server (which is configured for 192.168.86.13)
        # If the user customised it, we want to keep theirs.
        # But wait, the server zip contains config.py with the CORRECT IP usually.
        # The ONLY issue is if user changed something else.
        # Let's restore backup if it exists.
        if has_config:
            shutil.move("config.py.bak", "config.py")
            print("Restored config.py")

        # Update local version file
        with open(LOCAL_VERSION_FILE, "w") as f:
            f.write(new_version)

        print("✅ Update complete! Restarting...")
        # We can't restart easily from python if called from batch.
        # The batch file should handle restart or we just exit and let user restart?
        # Or better: run.bat calls updater.py then main.py.
        # If updater updates, it just finishes. Then main.py runs new code.
        
    except Exception as e:
        print(f"Update failed: {e}")
        # Restore backup if failed?
        if os.path.exists("config.py.bak"):
             shutil.move("config.py.bak", "config.py")

if __name__ == "__main__":
    check_for_updates()
