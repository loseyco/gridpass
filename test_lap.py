import requests
import json

API_URL = "http://192.168.86.53:3000/api"
TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjM0NWFiM2JhLTJmY2EtNGQ2Yi1iMTJmLTA0YjYwYmQ3ZTg0MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2J3cG1xc2R5a3VtdGZ1c2ZsaHJpLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyMzExMjg4My0zNzc1LTQ5OTQtYTZjOS1lNjY0MDk1MzUxNzMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcxMTM0MDU4LCJpYXQiOjE3NzExMzA0NTgsImVtYWlsIjoicGpsb3NleUBvdXRsb29rLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJwamxvc2V5QG91dGxvb2suY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiMjMxMTI4ODMtMzc3NS00OTk0LWE2YzktZTY2NDA5NTM1MTczIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NzExMzA0NTh9XSwic2Vzc2lvbl9pZCI6IjUxY2IzOGI4LWNlNzItNDdjYS1iOTcxLWJiNTc2YmUzMjQzMiIsImlzX2Fub255bW91cyI6ZmFsc2V9.lxODMVv95lHXamTNrKfI3u5Sz3Bp9xE3O-okX0Z4BYulvDmxKaLoqPr5nJaPQmeJJTFGmtNc7YjhoPc9rp-vWQ"

lap_data = {
    "game": "iRacing-Test",
    "track": "Test Track",
    "car": "Test Car",
    "lap_time": 99.999,
    "fuel_used": 0.5,
    "sector1": 30.0,
    "sector2": 30.0,
    "sector3": 39.999
}

print(f"Sending lap data...")

try:
    resp = requests.post(
        f"{API_URL}/telemetry/laps", 
        json=lap_data,
        headers={"Authorization": f"Bearer {TOKEN}"}
    )
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
