import requests
import json

API_URL = "http://192.168.86.53:3000/api"
SECRET = "7a9dead4-2348-4f0e-9d28-5e3867ef6bf8"

print(f"Polling with secret: {SECRET}")

try:
    resp = requests.post(
        f"{API_URL}/auth/device/poll", 
        json={"device_secret": SECRET}
    )
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
