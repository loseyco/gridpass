"""
Device Manager - Handles device registration, heartbeat, and PC info gathering
"""
import platform
import socket
import hashlib
import requests
import psutil

try:
    import GPUtil
    HAS_GPU = True
except ImportError:
    HAS_GPU = False


class DeviceManager:
    def __init__(self, api_base_url):
        self.api_base_url = api_base_url
        self.device_id = None
        self.hardware_fingerprint = self._generate_fingerprint()
        self.pc_info = self._gather_pc_info()
    
    def _generate_fingerprint(self):
        """Generate unique hardware fingerprint"""
        # Use MAC address + hostname for fingerprint
        hostname = socket.gethostname()
        
        # Get MAC address
        import uuid
        mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff) 
                       for elements in range(0,2*6,2)][::-1])
        
        fingerprint_data = f"{hostname}-{mac}"
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()
    
    def _gather_pc_info(self):
        """Gather PC specifications"""
        info = {
            "cpu_model": platform.processor() or "Unknown CPU",
            "ram_gb": round(psutil.virtual_memory().total / (1024**3)),
            "os_version": f"{platform.system()} {platform.release()}",
            "gpu_model": None
        }
        
        # Try to get GPU info
        if HAS_GPU:
            try:
                gpus = GPUtil.getGPUs()
                if gpus:
                    info["gpu_model"] = gpus[0].name
            except Exception:
                pass
        
        return info
    
    def register(self, auth_token, device_name=None):
        """Register this device with GridPass"""
        if not device_name:
            device_name = socket.gethostname()
        
        payload = {
            "name": device_name,
            "hardware_fingerprint": self.hardware_fingerprint,
            "pc_specs": self.pc_info,
            "clear_commands": True # Always clear old commands on fresh start
        }
        
        print(f"DEBUG: Registering with URL: {self.api_base_url}/sim-racing/devices/register")
        
        try:
            response = requests.post(
                f"{self.api_base_url}/sim-racing/devices/register",
                json=payload,
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            print(f"DEBUG: Registration Response: {response.status_code} - {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                self.device_id = data.get("device_id") # Server returns device_id, not device object sometimes?
                # Check server code: returns { success: true, device_id: ... }
                # But code below used data.get("device", {}).get("id")
                # I should fix that too.
                if not self.device_id:
                     self.device_id = data.get("device", {}).get("id")
                
                print(f"✓ Device registered: {device_name}")
                print(f"  ID: {self.device_id}")
                return True
            else:
                print(f"✗ Registration failed: {response.text}")
                return False
        
        except Exception as e:
            print(f"✗ Registration error: {e}")
            return False
    
    def heartbeat(self, auth_token, telemetry=None):
        """Send heartbeat and get pending commands"""
        if not self.device_id:
            print("✗ Device not registered")
            return {}
        
        payload = {
            "status": "online"
        }
        
        if telemetry:
            payload["telemetry"] = telemetry
        
        try:
            response = requests.post(
                f"{self.api_base_url}/sim-racing/devices/{self.device_id}/heartbeat",
                json=payload,
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {}
        
        except Exception as e:
            print(f"✗ Heartbeat error: {e}")
            return {}

    def send_lap_telemetry(self, auth_token, lap_data):
        """Send lap completion telemetry"""
        try:
            response = requests.post(
                f"{self.api_base_url}/telemetry/laps",
                json=lap_data,
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            if response.status_code == 200:
                print(f"✓ Lap saved: {lap_data.get('lap_time')}s")
                return True
            else:
                print(f"✗ Failed to save lap: {response.text}")
                return False
                
        except Exception as e:
            print(f"✗ Lap telemetry error: {e}")
            return False
