"""
Command Executor - Context-aware command execution for iRacing
"""
import time
import pyautogui
import subprocess
from . import config as sim_config

try:
    import win32gui
    import win32con
    import win32com.client
    HAS_WIN32 = True
except ImportError:
    HAS_WIN32 = False

print(f"DEBUG: Loading command_executor from {__file__}")


class CommandExecutor:
    def __init__(self, ir):
        self.ir = ir
    
    def execute(self, command_type: str, parameters: dict) -> dict:
        """Execute a command with context awareness"""
        
        # Map command types to methods
        command_map = {
            "reset_car": self._reset_car,
            "enter_car": self._enter_car,
            "exit_car": self._exit_car,
            "ignition": self._toggle_ignition,
            "pit_limiter": self._toggle_pit_limiter,
        }
        
        handler = command_map.get(command_type)
        
        if not handler:
            return {
                "success": False,
                "error_message": f"Unknown command: {command_type}"
            }
        
        try:
            # Focus iRacing window
            if HAS_WIN32:
                self._focus_iracing()
            
            # Execute command
            handler(parameters)
            
            return {"success": True}
        
        except Exception as e:
            return {
                "success": False,
                "error_message": str(e)
            }
    
    def _focus_iracing(self):
        """Focus the iRacing window"""
        try:
            print("DEBUG: _focus_iracing() called...")
            hwnd = win32gui.FindWindow(None, "iRacing.com Simulator")
            if hwnd:
                print(f"DEBUG: Found iRacing window HWND: {hwnd}")
                # Try multiple methods to force focus
                try:
                    win32gui.ShowWindow(hwnd, 5) # SW_SHOW
                    win32gui.SetForegroundWindow(hwnd)
                except Exception as e:
                    print(f"DEBUG: Failed to SetForegroundWindow: {e}")
                    # Try using Shell for tougher cases (e.g. admin restriction)
                    try:
                        shell = win32com.client.Dispatch("WScript.Shell")
                        shell.AppActivate("iRacing.com Simulator")
                    except:
                        pass
                
                time.sleep(0.2)
            else:
                print("DEBUG: Could not find window 'iRacing.com Simulator'")
                # Try finding ANY window with "iRacing" in title?
                def callback(hwnd, windows):
                    if win32gui.IsWindowVisible(hwnd):
                        title = win32gui.GetWindowText(hwnd)
                        if "iRacing" in title:
                            windows.append((hwnd, title))
                windows = []
                win32gui.EnumWindows(callback, windows)
                if windows:
                    print(f"DEBUG: Found alternative windows: {windows}")
                    hwnd, title = windows[0]
                    print(f"DEBUG: attempting focus on {title} ({hwnd})")
                    win32gui.SetForegroundWindow(hwnd)
        except Exception as e:
            print(f"DEBUG: _focus_iracing Exception: {e}")
            pass
    
    def _get_driver_state(self):
        """Get current driver state from telemetry"""
        if not self.ir or not self.ir.is_connected:
            return "unknown"
        
        # Check if in car
        player_car_idx = self.ir['PlayerCarIdx']
        if player_car_idx is None:
            return "menu"
        
        is_on_track = self.ir['IsOnTrack']
        if not is_on_track:
            return "garage"
        
        return "in_car"
    
    def _speak(self, text):
        """Speak text using PowerShell TTS (non-blocking)"""
        try:
             # Using Start-Process to avoid console window flash
             # Actually subprocess.Popen with creationflags handles suppression.
             cmd = f"Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('{text}')"
             subprocess.Popen(["powershell", "-NoProfile", "-Command", cmd], 
                              creationflags=subprocess.CREATE_NO_WINDOW if HAS_WIN32 else 0)
        except:
             pass

    def _reset_car(self, params):
        """Reset car to pits (Hold until on pit road)"""
        state = self._get_driver_state()
        if state != "in_car":
            # If in garage/menu, maybe we can't reset?
            # But sometimes 'reset' works from replay screen?
            # Safest to assume we must be in car or driving.
            pass 
        
        # Press AND HOLD reset key
        key = sim_config.KEYBINDS.get("reset_car", "r")
        print(f"DEBUG: Holding '{key}' to reset...")
        pyautogui.keyDown(key)
        
        # Wait for state change (max 2s)
        # We want to see if 'CarIdxOnPitRoad' becomes True for us?
        # Or just hold for a fixed duration that is "long enough" (e.g. 1.5s)
        # State monitoring is better but complex if 'ir' is lagging.
        # Let's try flexible hold.
        
        # Wait for state change (max 2s)
        for _ in range(15): # 1.5 seconds max
            time.sleep(0.1)
            pass
            
        pyautogui.keyUp(key)
        time.sleep(0.5)
        
        # REVERTED: Do NOT cut ignition on simple reset (User request)
        pass

    def _enter_car(self, params):
        """Enter the car dynamically using controls from controls.cfg"""
        # 1. State Check: Are we already in car?
        if self._get_driver_state() == "in_car":
             print("DEBUG: Already in car.")
             return {"success": True}

        # Safety: Check Throttle Input to prevent launch
        try:
             throttle = self.ir['Throttle']
             if throttle > 0.05: # 5% threshold
                 print(f"SAFETY: Throttle detected ({throttle:.2f}). Aborting Enter.")
                 return {
                     "success": False, 
                     "error_message": "Safety: Release throttle pedal before entering car." 
                 }
        except:
             pass 

        print("DEBUG: Attempting to Enter Car (using controls.cfg logic)...")
        
        # Dynamic Loading
        try:
            from .controls_loader import ControlsLoader
            loader = ControlsLoader()
            keys = loader.get_action_keys("enter_car")
        except Exception as e:
            print(f"DEBUG: Failed to load controls: {e}")
            keys = []
            
        if not keys:
            print("DEBUG: No binding found/parsed for enter_car, falling back to defaults [enter, space, r]")
            attempts = [['enter'], ['space'], ['r']] # Added 'r' as it is common default for Reset
        else:
            print(f"DEBUG: Found binding from controls: {keys}")
            attempts = [keys]

        for key_combo in attempts:
            print(f"DEBUG: Pressing {key_combo}...")
            # Hold key logic (important for Reset mapped to Enter)
            for key in key_combo:
                pyautogui.keyDown(key)
            
            time.sleep(1.0) # Hold for 1 sec
            
            for key in reversed(key_combo):
                pyautogui.keyUp(key)
            
            time.sleep(2.0) # Wait for sim to react
            
            # Check success
            if self._get_driver_state() == "in_car":
                 print("DEBUG: Successfully entered car!")
                 self._speak("Car Ready.")
                 return {"success": True}
        
        print("DEBUG: Failed to enter car. Still in menu.")
        return {"success": False, "error_message": "Failed to enter car (controls checked)"}

    def _exit_car(self, params):
        """Exit to garage (Smart Exit)"""
        state = self._get_driver_state()
        if state == "menu" or state == "garage":
            return # Already out
            
        print("DEBUG: Smart Exit Initiated...")
        self._speak("Stopping car to exit.")
        
        # 1. STOP THE CAR (Coast to stop if moving)
        try:
            # Loop until stopped
            max_wait = 60 # 60 seconds max coast time
            start_wait = time.time()
            ignition_cut_attempted = False
            
            while True:
                speed = self.ir['Speed'] # m/s
                rpm = self.ir['RPM']
                
                # Check if stopped (Speed < 0.5 m/s approx 1 mph)
                if speed < 0.5:
                    print("DEBUG: Car is stopped.")
                    break
                    
                # Time limit
                if time.time() - start_wait > max_wait:
                    print("DEBUG: Timeout waiting for stop. Trying exit anyway.")
                    break
                    
                # Force Engine OFF if running
                # Only toggle ONCE if RPM is high. 
                # Avoid cycling if car is coasting in gear (which keeps RPM high).
                if rpm > 100 and not ignition_cut_attempted:
                    print(f"SAFETY: Speed {speed*2.23:.1f} mph / RPM {rpm:.0f}. Cutting ignition (Single Attempt)...")
                    self._toggle_ignition(None)
                    ignition_cut_attempted = True
                    time.sleep(1.0) # Wait a bit
                elif rpm > 100:
                     # Already cut it, just coasting
                     print(f"DEBUG: Coasting (Ignition Cut)... Speed {speed*2.23:.1f} mph / RPM {rpm:.0f}")
                     time.sleep(1.0)
                else:
                    # Just coasting (rpm low)
                    print(f"DEBUG: Coasting... {speed*2.23:.1f} mph")
                    time.sleep(1.0)
                    
        except:
             pass

        # 2. Tow/Exit (Now that we are stopped)
        print("DEBUG: Exiting to Garage...")
        pyautogui.keyDown('esc')
        time.sleep(2.0) # Long hold to exit
        pyautogui.keyUp('esc')
        time.sleep(0.5)
    
    def _toggle_ignition(self, params):
        """Toggle ignition (Solid press)"""
        key = sim_config.KEYBINDS.get("ignition", "i")
        print(f"DEBUG: Toggling Ignition '{key}'")
        pyautogui.keyDown(key)
        time.sleep(0.15) # Distinct press
        pyautogui.keyUp(key)
        time.sleep(0.1)
    
    def _toggle_pit_limiter(self, params):
        """Toggle pit limiter"""
        key = sim_config.KEYBINDS.get("pit_limiter", "l")
        pyautogui.keyDown(key)
        time.sleep(0.1)
        pyautogui.keyUp(key)

