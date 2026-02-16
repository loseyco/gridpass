"""
Quick Test - Test client without full dependencies

This runs a minimal test:
1. Registers device
2. Sends heartbeat
3. Polls for commands

No iRacing integration required.
"""
import sys
import time
import json

# Check if requests is available
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    print("❌ requests library not installed")
    print("   Install with: pip install requests")
    sys.exit(1)

# Mock the other dependencies
class MockDeviceManager:
    def __init__(self, api_base_url):
        self.api_base_url = api_base_url
        self.device_id = None
        self.hardware_fingerprint = "test-fingerprint-12345"
        self.pc_info = {
            "cpu_model": "Test CPU",
            "ram_gb": 16,
            "os_version": "Windows 11",
            "gpu_model": "Test GPU"
        }
    
    def register(self, auth_token, device_name=None):
        """Register device"""
        if not device_name:
            device_name = "Test Device"
        
        payload = {
            "name": device_name,
            "hardware_fingerprint": self.hardware_fingerprint,
            **self.pc_info
        }
        
        try:
            response = requests.post(
                f"{self.api_base_url}/sim-racing/devices/register",
                json=payload,
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            print(f"\n📡 Registration Response:")
            print(f"   Status: {response.status_code}")
            print(f"   Body: {response.text[:200]}")
            
            if response.status_code == 200:
                data = response.json()
                self.device_id = data.get("device", {}).get("id")
                print(f"\n✅ Registered: {device_name}")
                print(f"   Device ID: {self.device_id}")
                return True
            else:
                print(f"\n❌ Registration failed")
                return False
        
        except Exception as e:
            print(f"\n❌ Error: {e}")
            return False
    
    def heartbeat(self, auth_token, telemetry=None):
        """Send heartbeat"""
        if not self.device_id:
            print("❌ No device ID")
            return {}
        
        payload = {"status": "online"}
        if telemetry:
            payload["telemetry"] = telemetry
        
        try:
            response = requests.post(
                f"{self.api_base_url}/sim-racing/devices/{self.device_id}/heartbeat",
                json=payload,
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                commands = data.get("commands", [])
                if commands:
                    print(f"\n📨 Received {len(commands)} command(s):")
                    for cmd in commands:
                        print(f"   - {cmd.get('command_type')}")
                return data
            else:
                print(f"❌ Heartbeat failed: {response.status_code}")
                return {}
        
        except Exception as e:
            print(f"❌ Heartbeat error: {e}")
            return {}


def main():
    import config
    
    print("\n╔════════════════════════════════╗")
    print("║   GridPass Client - Quick Test ║")
    print("╚════════════════════════════════╝\n")
    
    print(f"API URL: {config.API_BASE_URL}")
    print(f"Supabase: {config.SUPABASE_URL}\n")
    
    # Get token
    print("📝 You need an access token from your browser:")
    print("   1. Open http://localhost:3000")
    print("   2. Login")
    print("   3. Open DevTools (F12), Console tab")
    print("   4. Run: JSON.parse(localStorage.getItem('sb-localhost-auth-token')).access_token")
    print("   5. Copy the token\n")
    
    token = input("Paste your access token: ").strip()
    
    if not token:
        print("❌ No token provided")
        sys.exit(1)
    
    # Create device manager
    dm = MockDeviceManager(config.API_BASE_URL)
    
    # Register
    device_name = input("\nDevice name (or Enter for 'Test Device'): ").strip() or "Test Device"
    
    if not dm.register(token, device_name):
        print("\n❌ Registration failed - check API is running")
        sys.exit(1)
    
    # Heartbeat loop
    print("\n✅ Running! Sending heartbeat every 5 seconds...")
    print("   (Open web UI to send commands: http://localhost:3000/devices)")
    print("   Press Ctrl+C to stop\n")
    
    try:
        while True:
            dm.heartbeat(token, telemetry={"sim_racing": {"connected": False}})
            time.sleep(5)
    
    except KeyboardInterrupt:
        print("\n\n👋 Stopped")


if __name__ == "__main__":
    main()
