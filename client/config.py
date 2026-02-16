"""
GridPass Client Configuration
"""

# API Configuration
# Replace localhost with your PC's IP if running on a separate device (laptop)
# Local Development Override
import os
import sys

# Default URL
API_BASE_URL = "https://gridpass.vercel.app/api"

# 1. Determine Base Path (Frozen vs Script)
def get_base_path():
    if getattr(sys, 'frozen', False):
        # If running as compiled .exe, use the directory of the executable
        return os.path.dirname(sys.executable)
    # If running as script, use the directory of this file
    return os.path.dirname(os.path.abspath(__file__))

BASE_PATH = get_base_path()

# 2. Try config_local.py (Priority 1)
# Note: We need to add BASE_PATH to sys.path to import it if it's external
if os.path.exists(os.path.join(BASE_PATH, "config_local.py")):
    try:
        if BASE_PATH not in sys.path:
            sys.path.append(BASE_PATH)
        import config_local
        if hasattr(config_local, "API_BASE_URL"):
            API_BASE_URL = config_local.API_BASE_URL
            print(f"DEBUG: Using Manual Local Config: {API_BASE_URL}")
    except ImportError:
        pass
    except Exception as e:
        print(f"DEBUG: Error loading config_local: {e}")

# 2. Try Auto-Detect 192.168.1.53 (Priority 2, only if not overridden)
# Unless overridden by config_local? Yes.
# But wait, config_local is priority 1, so if it set API_BASE_URL, we stop there?
# Actually, check if config_local set it different from default?
# API_BASE_URL starts as PROD.
# If config_local loaded, it's set.
# If NOT config_local (API_BASE_URL == PROD), try auto-detect.

if API_BASE_URL == "https://gridpass.vercel.app/api":
    try:
        import requests
        # Try connecting to user's IP (Confirmed: 192.168.86.53)
        TARGET_IP = "192.168.86.53"
        print(f"DEBUG: Auto-detecting local server at {TARGET_IP}...")
        try:
            requests.get(f"http://{TARGET_IP}:3000", timeout=1) # 1 sec timeout
            API_BASE_URL = f"http://{TARGET_IP}:3000/api"
            print(f"DEBUG: Server found! Using Auto-Detected URL: {API_BASE_URL}")
        except:
            print("DEBUG: Local server not found. Using Production.")
            pass
    except ImportError:
        pass
  # Change to https://gridpass.app/api in production
SUPABASE_URL = "https://bwpmqsdykumtfusflhri.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_ZnE5mpfMFlN7-vskwrrUYA_hqDJYhfk"

# Client Info
CLIENT_VERSION = "1.0.0"
APP_NAME = "GridPass Client"

# Core Settings
HEARTBEAT_INTERVAL = 5  # How often to ping server (seconds)
COMMAND_POLL_INTERVAL = 2  # How often to check for commands

# Enabled Modules (toggle features on/off)
MODULES_ENABLED = {
    "sim_racing": True,      # iRacing, ACC, etc.
    "real_telemetry": False, # Real car data logging (future)
    "file_sync": False,      # P2P file sharing (future)
}
