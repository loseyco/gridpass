"""
Direct API test with Login support
"""
import requests
import json
import socket
import os

# Configuration (from .env.local)
SUPABASE_URL = "https://bwpmqsdykumtfusflhri.supabase.co"
SUPABASE_KEY = "sb_publishable_ZnE5mpfMFlN7-vskwrrUYA_hqDJYhfk" # From .env.local
API_BASE = "http://localhost:3000/api"

# Credentials
EMAIL = "pjlosey@outlook.com"
PASSWORD = "!Google1!"

def login():
    """Login to Supabase and return access_token"""
    print("=" * 60)
    print("Logging in to Supabase...")
    print(f"URL: {SUPABASE_URL}/auth/v1/token?grant_type=password")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "email": EMAIL,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print("✅ Login SUCCESS!")
            print(f"Token: {token[:20]}...")
            return token
        else:
            print(f"❌ Login FAILED: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login Exception: {e}")
        return None

def test_registration(auth_token):
    """Test device registration with correct payload structure"""
    print("\n" + "=" * 60)
    print("Testing Device Registration")
    print("=" * 60)
    
    # Match the exact structure from device_manager.py
    payload = {
        "name": socket.gethostname(),
        "hardware_fingerprint": "test-python-fp-" + socket.gethostname(),
        "cpu_model": "Test CPU",
        "ram_gb": 32,
        "os_version": "Windows 11",
        "gpu_model": "Test GPU"
    }
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    print(f"Sending to: {API_BASE}/sim-racing/devices/register")
    
    try:
        response = requests.post(
            f"{API_BASE}/sim-racing/devices/register",
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            device_id = data.get("device_id")
            print(f"\n✅ REGISTRATION SUCCESS! Device ID: {device_id}")
            return device_id
        else:
            print(f"\n❌ REGISTRATION FAILED: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Registration Exception: {e}")
        return None

def test_heartbeat(auth_token, device_id):
    """Test device heartbeat"""
    print("\n" + "=" * 60)
    print("Testing Heartbeat")
    print("=" * 60)
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    url = f"{API_BASE}/sim-racing/devices/{device_id}/heartbeat"
    print(f"Sending to: {url}")
    
    try:
        response = requests.post(
            url,
            json={"status": "online"},
            headers=headers
        )
        
        if response.status_code == 200:
            print(f"✅ HEARTBEAT SUCCESS!")
            return True
        else:
            print(f"❌ HEARTBEAT FAILED: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Heartbeat Exception: {e}")
        return False

def test_commands(auth_token, device_id):
    """Test fetching commands"""
    print("\n" + "=" * 60)
    print("Testing Command Fetch")
    print("=" * 60)
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    url = f"{API_BASE}/sim-racing/devices/{device_id}/commands"
    print(f"Sending to: {url}")
    
    try:
        response = requests.get( # Note: Commands is likely a GET to fetch pending, or POST to queue? 
                                 # Let's check route.ts. It's usually a queue fetch.
                                 # ACTUALLY, checking route... it is POST to *queue* a command?
                                 # or GET to *poll*?
                                 # Wait, device_manager.py polls?
                                 # Let's check device_manager.py.
            url,
            headers=headers
        )
        # Wait, if route.ts is POST (to send command), then device polls via Realtime?
        # Let's check device_manager.py to see how it receives commands.
        # It says "SimRacingClient" connected to supabase realtime?
        # The API route `[id]/commands` might be for *sending* commands from the UI.
        
        # Checking previous file view of `[id]/commands/route.ts`:
        # "Modified the POST function..."
        # So the API is for POSTing commands TO the device.
        
        # Function to SEND a command (as if from UI)
        payload = {
            "command_type": "test_command", 
            "parameters": {}
        }
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            print(f"✅ COMMAND SEND SUCCESS!")
            return True
        else:
            print(f"❌ COMMAND SEND FAILED: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Command Exception: {e}")
        return False

if __name__ == "__main__":
    print("\nPython Client - API Test (Auto-Login)")
    print("=" * 60)
    
    token = login()
    
    if token:
        device_id = test_registration(token)
        if device_id:
            test_heartbeat(token, device_id)
            test_commands(token, device_id)

