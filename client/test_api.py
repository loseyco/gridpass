"""
Direct API test - bypasses all interactive prompts
Tests device registration, heartbeat, and commands directly
"""
import requests
import json

# Hardcoded auth token for testing
AUTH_TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjM0NWFiM2JhLTJmY2EtNGQ2Yi1iMTJmLTA0YjYwYmQ3ZTg0MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2J3cG1xc2R5a3VtdGZ1c2ZsaHJpLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyMzExMjg4My0zNzc1LTQ5OTQtYTZjOS1lNjY0MDk1MzUxNzMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcxMDg3NTgxLCJpYXQiOjE3NzEwODM5ODEsImVtYWlsIjoicGpsb3NleUBvdXRsb29rLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJwamxvc2V5QG91dGxvb2suY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiMjMxMTI4ODMtMzc3NS00OTk0LWE2YzktZTY2NDA5NTM1MTczIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NzEwMjQ3ODN9XSwic2Vzc2lvbl9pZCI6IjVhNzM3MmI3LWQxYWMtNDQ5Mi1iYzEwLThiNzQwNTY5M2Q5NSIsImlzX2Fub255bW91cyI6ZmFsc2V9.c4mOVDD_vz-GguHwLsSX8tQnd_T2Ual6Do7325I5Qqo_-Y2SReNbBwUqEK2_yis_B1KedWoE_eNwoh2d35Z0Jg"

API_BASE = "http://localhost:3000/api"

def test_registration():
    """Test device registration"""
    print("=" * 60)
    print("1. Testing Device Registration")
    print("=" * 60)
    
    payload = {
        "name": "Python Client Test Device",
        "hardware_fingerprint": "test-python-client-12345",
        "pc_specs": {
            "cpu_model": "Test CPU",
            "ram_gb": 32,
            "gpu_model": "Test GPU",
            "os_version": "Windows 11"
        }
    }
    
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{API_BASE}/sim-racing/devices/register",
        json=payload,
        headers=headers
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        device_id = response.json().get("device_id")
        print(f"\n✅ SUCCESS! Device ID: {device_id}")
        return device_id
    else:
        print(f"\n❌ FAILED")
        return None

def test_heartbeat(device_id):
    """Test heartbeat"""
    print("\n" + "=" * 60)
    print("2. Testing Heartbeat")
    print("=" * 60)
    
    payload = {
        "status": "online",
        "telemetry": {
            "test_key": "test_value"
        }
    }
    
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{API_BASE}/sim-racing/devices/{device_id}/heartbeat",
        json=payload,
        headers=headers
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print(f"\n✅ SUCCESS!")
        return True
    else:
        print(f"\n❌ FAILED")
        return False

def test_command(device_id):
    """Test sending command"""
    print("\n" + "=" * 60)
    print("3. Testing Command Sending")
    print("=" * 60)
    
    payload = {
        "command_type": "reset_car",
        "parameters": {}
    }
    
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{API_BASE}/sim-racing/devices/{device_id}/commands",
        json=payload,
        headers=headers
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print(f"\n✅ SUCCESS!")
        return True
    else:
        print(f"\n❌ FAILED")
        return False

if __name__ == "__main__":
    print("\n🐍 Python Client - Direct API Test")
    print("=" * 60)
    print(f"Token length: {len(AUTH_TOKEN)} chars")
    print(f"API Base: {API_BASE}")
    print()
    
    # 1. Register device
    device_id = test_registration()
    
    if not device_id:
        print("\n⚠️  Registration failed, cannot continue")
        exit(1)
    
    # 2. Test heartbeat
    if not test_heartbeat(device_id):
        print("\n⚠️  Heartbeat failed")
    
    # 3. Test command
    if not test_command(device_id):
        print("\n⚠️  Command failed")
    
    print("\n" + "=" * 60)
    print("✅ All API tests complete!")
    print("=" * 60)
    print(f"\n✨ Check http://localhost:3000/devices to see your device!")
