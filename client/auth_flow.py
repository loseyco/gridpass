import requests
import json
import time
import os
import sys

# Try importing qrcode, but fallback if not installed (though we installed it)
try:
    import qrcode
except ImportError:
    qrcode = None

# Configuration
# Default to localhost if not set
API_BASE = os.environ.get("GRIDPASS_API_URL", "http://localhost:3000/api")

class AuthManager:
    def __init__(self, api_base=None):
        self.api_base = api_base or API_BASE
        # Save token in the same directory as this script
        self.token_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "auth_token.json")

    def get_token(self, on_code_received=None):
        """Get existing token or start activation flow"""
        token = self.load_token()
        if token:
            print("✅ Found existing session.")
            return token
        
        return self.start_activation_flow(on_code_received)

    def load_token(self):
        """Load token from local file"""
        if os.path.exists(self.token_file):
            try:
                with open(self.token_file, 'r') as f:
                    data = json.load(f)
                    
                    # Check expiry
                    expires_at = data.get("expires_at", 0)
                    
                    refresh_token = data.get("refresh_token")
                    if refresh_token:
                        # Validate?
                        now = time.time()
                        # If expires_at is int
                        if isinstance(expires_at, int):
                            if expires_at < now + 300: # Expiring in 5 mins
                                return self.refresh_session(refresh_token)
                        
                        # Even better: call refresh endpoint if no expiry info or force check
                        # But refreshing every time might be too much if we restart often?
                        # No, it's fine.
                        print("Checking session validity...")
                        new_token = self.refresh_session(refresh_token)
                        if new_token:
                            return new_token
                        
                        print("⚠ Session expired and refresh failed.")
                        return None # Trigger re-auth

                    return data.get("access_token")
            except Exception as e:
                print(f"Error loading token: {e}")
                return None
        return None

    def save_token(self, session_data):
        """Save token to local file"""
        with open(self.token_file, 'w') as f:
            json.dump(session_data, f)
        print("✅ Session saved.")

    def refresh_session(self, refresh_token):
        """Refresh using server endpoint"""
        try:
            print("Refreshing session...")
            resp = requests.post(
                f"{self.api_base}/auth/refresh",
                json={"refresh_token": refresh_token},
                timeout=10
            )
            
            if resp.status_code == 200:
                data = resp.json()
                session = data.get("session")
                if session:
                    self.save_token(session)
                    print("✓ Session refreshed")
                    return session.get("access_token")
            else:
                print(f"Refresh failed: {resp.status_code} - {resp.text}")
                
        except Exception as e:
            print(f"Refresh callback error: {e}")
            
        return None

    def start_activation_flow(self, on_code_received=None):
        """Start the TV-style pairing flow"""
        print("\n" + "="*60)
        print("🔒 DEVICE ACTIVATION REQUIRED")
        print("="*60)
        
        try:
            print("Contacting server to initialize activation...")
            # 1. Initialize
            try:
                response = requests.post(f"{self.api_base}/auth/device/init")
            except requests.exceptions.ConnectionError:
                print(f"❌ Could not connect to {self.api_base}")
                return None
                
            if response.status_code != 200:
                print(f"❌ Failed to initialize activation. Status: {response.status_code}")
                print(response.text)
                return None
            
            data = response.json()
            print(f"DEBUG: Init response keys: {list(data.keys())}")
            print(f"DEBUG: Init payload: {data}")
            
            user_code = data.get('user_code')
            device_secret = data.get('device_secret') or data.get('device_code') # Fallback
            verification_uri = data.get('verification_uri')
            
            if not user_code or not device_secret:
                print("❌ Invalid response from server")
                return None
            
            # 2. Display Code & QR
            full_url = f"{verification_uri}?code={user_code}"

            if on_code_received:
                try:
                    on_code_received(user_code, full_url)
                except Exception as e:
                    print(f"Callback error: {e}")
            
            print("\nAction Required:")
            print(f"1. Scan the QR code below OR visit:")
            print(f"   👉 {full_url}")
            print(f"2. Log in and enter this code:")
            
            print(f"\n   ╔═══════════════════╗")
            print(f"   ║    {user_code}    ║")
            print(f"   ╚═══════════════════╝\n")
            
            # Generate QR
            if qrcode:
                qr = qrcode.QRCode()
                qr.add_data(full_url)
                qr.print_ascii()
            else:
                print("(Install 'qrcode' library to see QR code)")
            
            print("\nWaiting for you to complete activation in browser...")
            print("(Press Ctrl+C to cancel)")
            
            # 3. Poll
            while True:
                time.sleep(2) # Poll every 2s
                
                try:
                    poll_resp = requests.post(
                        f"{self.api_base}/auth/device/poll",
                        json={"device_secret": device_secret}
                    )
                except:
                    continue
                
                if poll_resp.status_code != 200:
                    continue
                    
                poll_data = poll_resp.json()
                status = poll_data.get('status')
                
                if status == 'completed':
                    session = poll_data.get('session')
                    if session:
                        self.save_token(session)
                        print("\n✅ Device successfully linked!")
                        return session.get('access_token')
                    
                if status == 'expired':
                    print("\n❌ Code expired. Please restart.")
                    return None
                    
        except KeyboardInterrupt:
            print("\nActivation cancelled.")
            return None
        except Exception as e:
            print(f"\n❌ Error: {e}")
            return None

if __name__ == "__main__":
    auth = AuthManager()
    token = auth.get_token()
    if token:
        print(f"Token: {token[:10]}...")
