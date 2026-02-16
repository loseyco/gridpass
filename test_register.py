import requests
import json

API_URL = "http://192.168.86.53:3000/api"
# Use a valid token? Or try to use anon if allowed? 
# The route tries Bearer first, then cookies.
# Since I'm running this script outside browser, I need a token.
# But getting a token requires the whole auth flow.
# Wait, can I just insert into DB directly to prove the Dashboard works?
# Yes, but I want to test the API.

# Actually, I can use the supabase client in python to sign in with email/pass if I had credentials.
# Or I can just check if the endpoint is reachable.

# Let's try to hit it without auth and see if we get 401.
try:
    print(f"Testing connection to {API_URL}...")
    resp = requests.get(f"{API_URL}/health") # Does health exist? Probably not.
    print(f"Health check: {resp.status_code}")
except Exception as e:
    print(f"Connection failed: {e}")

# Try register without auth
try:
    resp = requests.post(f"{API_URL}/sim-racing/devices/register", json={
        "name": "Test Device",
        "hardware_fingerprint": "test-123"
    })
    print(f"Register (No Auth): {resp.status_code} - {resp.text}")
except Exception as e:
    print(f"Register failed: {e}")
