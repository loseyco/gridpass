"""
Sim Racing Module - Handles iRacing integration and telemetry
"""
import time
import math
import logging
import threading
import requests
import json
import config
from .command_executor import CommandExecutor
from .sim_realtime import RealtimeManager
from . import config as sim_config

logger = logging.getLogger(__name__)

try:
    import irsdk
    HAS_IRSDK = True
except ImportError:
    HAS_IRSDK = False
    print("⚠️  irsdk not installed - sim racing features disabled")


class SimRacingModule:
    def __init__(self, device_id, device_manager, auth_token):
        self.device_id = device_id
        self.device_manager = device_manager
        self.auth_token = auth_token
        self.ir = None
        self.connected = False
        self.command_executor = None
        self.last_telemetry_time = 0
        self.telemetry_interval = 0.05  # 20Hz update rate
        self.running = False
        self.update_thread = None
        
        # Realtime Manager
        self.realtime = RealtimeManager(
            config.SUPABASE_URL, 
            config.SUPABASE_ANON_KEY, 
            device_id
        )
        self.realtime.start()
        
        # Telemetry State
        self.telemetry = {}
        self.session_info = {} # Stores static data (Car, Track)
        self.last_lap_completed = -1

    def start(self):
        """Start the module"""
        if not HAS_IRSDK:
            print("✗ irsdk not available - skipping sim racing module")
            return
        
        self.running = True
        self.ir = irsdk.IRSDK()
        self.command_executor = CommandExecutor(self.ir)
        
        # Start background thread for telemetry
        self.update_thread = threading.Thread(target=self._background_update, daemon=True)
        self.update_thread.start()
        
        print("✓ Sim racing module started")
    
    def stop(self):
        """Stop the module"""
        self.running = False
        self.realtime.stop()
        if self.update_thread:
            self.update_thread.join(timeout=2)
    
    def _background_update(self):
        """Background thread for telemetry capture"""
        while self.running:
            try:
                self._check_connection()
                
                if self.connected:
                    self._process_telemetry()
                    # High frequency update
                    time.sleep(1/60) 
                else:
                    # Low frequency when disconnected
                    time.sleep(sim_config.IRACING_CHECK_INTERVAL)
                    
            except Exception as e:
                # Only print error once per 5s to avoid spam
                print(f"✗ Sim racing update error: {e}")
                time.sleep(5)
    
    def _log(self, message):
        """Helper for timestamped logging"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")

    def _check_connection(self):
        """Check if connected to iRacing"""
        # Helper for debounce
        if not hasattr(self, 'disconnect_time'):
            self.disconnect_time = 0
            
        # IRSDK startup
        if self.ir.startup():
            if not self.connected:
                self._log("✓ Connected to iRacing")
                self.connected = True
                self.disconnect_time = 0
            else:
                self.disconnect_time = 0 # Reset if valid
        else:
            if self.connected:
                # Just lost connection. Start timer.
                if self.disconnect_time == 0:
                     self.disconnect_time = time.time()
                
                # If disconnected for > 3 seconds, log it and set flag
                if time.time() - self.disconnect_time > 3.0:
                     self.connected = False
                     self._log("✗ Disconnected from iRacing")
                     self.last_lap_completed = -1 # Reset lap logic
                     self.disconnect_time = 0
                     self.session_info = {} # Clear session info
            else:
                self.disconnect_time = 0 # Already disconnected
                self.ir.shutdown()

    def _process_telemetry(self):
        """Read and process data from iRacing"""
        # Freeze buffer for consistent reading
        self.ir.freeze_var_buffer_latest()
        
        # Read Basic Telemetry
        self.telemetry = {
            "rpm": self.ir['RPM'],
            "speed": self.ir['Speed'] * 2.23694, # m/s to mph
            "gear": self.ir['Gear'],
            "fuel": self.ir['FuelLevel'],
            "oil_temp": self.ir['OilTemp'],
            "water_temp": self.ir['WaterTemp'],
            "lat": self.ir['Lat'],
            "lon": self.ir['Lon'],
            "car_idx": self.ir['CamCarIdx']
        }
        
        # Extract Session Info (Car/Track) loosely (not every frame if expensive?)
        # IRSDK var header lookup is fast, yaml info lookup might be slower.
        # Check if we have it already
        if not self.session_info.get("track"):
             try:
                 self.session_info["track"] = self.ir['WeekendInfo']['TrackDisplayName']
             except: pass
             
        if not self.session_info.get("car"):
             try:
                 player_idx = self.ir['PlayerCarIdx']
                 self.session_info["car"] = self.ir['DriverInfo']['Drivers'][player_idx]['CarScreenName']
             except: pass

        
        # Broadcast live telemetry
        self.realtime.broadcast(self.telemetry)
        
        # Lap Timing Logic
        lap_completed = self.ir['LapCompleted']
        
        # DEBUG: Print lap status every 100 updates (~5s)
        # self.debug_counter = getattr(self, 'debug_counter', 0) + 1
        # if self.debug_counter % 100 == 0:
        #     print(f"DEBUG: Lap: {lap_completed}, Last Saved: {self.last_lap_completed}, Last Time: {self.ir['LapLastLapTime']}")

        if lap_completed > self.last_lap_completed:
            print(f"DEBUG: Lap Change Detected! {self.last_lap_completed} -> {lap_completed}")
            
            if self.last_lap_completed != -1:
                try:
                    last_lap_time = self.ir['LapLastLapTime']
                except KeyError:
                    last_lap_time = 0.0

                print(f"DEBUG: Last Lap Time: {last_lap_time}")
                
                if last_lap_time > 0:
                     print(f"🏁 Lap {lap_completed} Completed: {last_lap_time:.3f}s")
                     
                     # Extract Metadata
                     try:
                         track = self.ir['WeekendInfo']['TrackDisplayName']
                     except:
                         track = "Unknown Track"
                         
                     try:
                         player_idx = self.ir['PlayerCarIdx']
                         car = self.ir['DriverInfo']['Drivers'][player_idx]['CarScreenName']
                     except:
                         car = "Unknown Car"

                     # Send to API
                     lap_data = {
                         "game": "iRacing",
                         "track": track,
                         "car": car,
                         "lap_time": last_lap_time,
                         "fuel_used": 0,
                         "sector1": self.ir['Sector1Time'], # Try to get sectors?
                         # Sector times might be 0 if not supported
                     }
                     
                     # Get token (handling expiry if possible in future, current simple pass)
                     threading.Thread(target=self.device_manager.send_lap_telemetry, 
                                      args=(self.auth_token, lap_data), daemon=True).start()
                else:
                    print("DEBUG: Lap time was 0 or invalid")
            else:
                print("DEBUG: First lap detection (initializing)")
            
            self.last_lap_completed = lap_completed

    def update(self):
        """Called from main loop"""
        pass
    
    def get_status(self):
        """Return current status for heartbeat"""
        status = {
            "connected": self.connected,
            "game": "iRacing" if self.connected else None,
        }
        
        if self.connected:
            status["telemetry"] = self.telemetry
            
        return status
    
    def execute_command(self, command: dict) -> dict:
        """Execute a remote command"""
        if not self.connected:
            return {
                "success": False,
                "error_message": "Not connected to iRacing"
            }
        
        command_type = command.get("command_type")
        parameters = command.get("parameters", {})
        
        # Execute via command executor
        result = self.command_executor.execute(command_type, parameters)
        
        return {
            "success": result.get("success", False),
            "error_message": result.get("error_message")
        }

    @property
    def is_on_track(self):
        """Check if driver is currently on track"""
        if not self.connected or not self.ir:
            return False
            
        try:
            return self.ir['IsOnTrack']
        except:
            return False
