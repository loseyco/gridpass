"""
GridPass Token Retrieval Script
Use this script to get your Authentication Token for the Python Client.
"""
import requests
import json
import getpass

# Configuration
SUPABASE_URL = "https://bwpmqsdykumtfusflhri.supabase.co"
SUPABASE_KEY = "sb_publishable_ZnE5mpfMFlN7-vskwrrUYA_hqDJYhfk"

def get_token():
    print("=" * 60)
    print("GridPass - Get Authentication Token")
    print("=" * 60)
    
    email = input("Enter your email: ")
    password = getpass.getpass("Enter your password: ")
    
    print("\nAuthenticating...")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "email": email,
        "password": password
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
            print("\n✅ Authentication Successful!")
            print("-" * 60)
            print("Your Auth Token (copy this entire string):")
            print("-" * 60)
            print(token)
            print("-" * 60)
            return token
        else:
            print(f"\n❌ Login Failed: {response.status_code}")
            try:
                print(f"Error: {response.json().get('error_description') or response.text}")
            except:
                print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"\n❌ Exception: {e}")
        return None

if __name__ == "__main__":
    get_token()
    input("\nPress Enter to exit...")
