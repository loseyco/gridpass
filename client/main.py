"""
GridPass Client - Universal Device Agent

Supports multiple modules:
- Sim Racing (iRacing, ACC, etc.)
- Real Car Telemetry (future)
- File Sync (future)
- Remote Control
"""
import time
import sys
import socket
import os
import json
import webbrowser
from datetime import datetime
from device_manager import DeviceManager
from modules.sim_racing.module import SimRacingModule
import config
import threading
from PIL import Image
import pystray


# --- Frozen App Logging Fix ---
if getattr(sys, 'frozen', False):
    class FileLogger:
        def __init__(self, filename):
            self.terminal = sys.stdout if sys.stdout else None
            self.log = open(filename, "a", encoding="utf-8")
        
        def write(self, message):
            self.log.write(message)
            self.log.flush() # Important for real-time
            if self.terminal:
                try: self.terminal.write(message)
                except: pass

        def flush(self):
            self.log.flush()
            if self.terminal:
                try: self.terminal.flush()
                except: pass

    log_file = os.path.join(config.BASE_PATH, "client_log.txt")
    logger = FileLogger(log_file)
    sys.stdout = logger
    sys.stderr = logger
    
    # Also override print just in case (though stdout redirection should cover it)
    # print is built-in, but writes to sys.stdout by default.

# Helper for timestamps
def log(msg):
    # Use standard print but prepend time
    # Check if msg starts with newline
    prefix = ""
    if msg.startswith("\n"):
        prefix = "\n"
        msg = msg[1:]
    
    timestamp = datetime.now().strftime('%H:%M:%S')
    formatted = f"[{timestamp}] {msg}"
    
    # extensive logging for debugging frozen app
    try:
        print(f"{prefix}{formatted}")
    except:
        pass # Handle no console case

    # Log to file
    try:
        log_path = os.path.join(config.BASE_PATH, "client_log.txt")
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"{prefix}{formatted}\n")
    except Exception:
        pass

class GridPassClient:
    def __init__(self):
        self.device_manager = DeviceManager(config.API_BASE_URL)
        # ... rest same ...
        self.auth_token = None
        self.running = False
        self.restart_required = False
        self.modules = {}
        
        self.pairing_code = None
        self.pairing_url = None
        self.on_menu_update = None
        self.on_ui_update = None # Callback for UI updates
        
        # Determine device name
        self.device_name = socket.gethostname()
        if os.path.exists("device.json"):
            try:
                with open("device.json", "r") as f:
                    data = json.load(f)
                    self.device_name = data.get("name", self.device_name)
            except:
                pass

    def initialize_modules(self):
        """Load enabled modules"""
        if config.MODULES_ENABLED.get("sim_racing"):
            log("⚡ Loading sim racing module...")
            self.modules["sim_racing"] = SimRacingModule(
                self.device_manager.device_id,
                self.device_manager,
                self.auth_token
            )
            self.modules["sim_racing"].start()
        
    def on_pairing_code(self, code, url):
        self.pairing_code = code
        self.pairing_url = url
        log(f"Received pairing code: {code}")
        
        # Trigger UI update
        if self.on_menu_update:
            try: self.on_menu_update() 
            except: pass
            
    def set_menu_updater(self, callback):
        self.on_menu_update = callback

    def login(self):
        """Login to GridPass"""
        print(f"\n╔════════════════════════════════╗")
        print(f"║     GridPass Client v1.0       ║")
        print(f"╚════════════════════════════════╝\n")
        
        log("Checking session validity...")
        
        from auth_flow import AuthManager
        auth_manager = AuthManager(api_base=config.API_BASE_URL)
        self.auth_token = auth_manager.get_token(on_code_received=self.on_pairing_code)
        
        if not self.auth_token:
            log("✗ Authentication failed")
            return False
        
        # Clear pairing code after successful login
        self.pairing_code = None
        if self.on_menu_update: 
            try: self.on_menu_update()
            except: pass
        
        return True
    
    def register_device(self):
        """Register this PC as a device"""
        # Auto-register with hostname to avoid blocking input
        log("DEBUG: Auto-registering device...")
        device_name = None # device_manager defaults to hostname if None
        success = self.device_manager.register(self.auth_token, device_name or None)
        
        if success:
            self.initialize_modules()
        
        return success
    
    
    def _speak(self, text):
        import subprocess
        try:
             # Check os.name? We assume Windows for Powershell TTS
             cmd = f"Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('{text}')"
             subprocess.Popen(["powershell", "-NoProfile", "-Command", cmd], 
                              creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
        except:
             pass

    def check_loop(self):
        """Main background loop"""
        self.running = True
        
        # Start update checker
        self.update_thread = threading.Thread(target=self._check_updates_background, daemon=True)
        self.update_thread.start()
        
        # Start token refresh loop
        self.refresh_thread = threading.Thread(target=self._refresh_token_loop, daemon=True)
        self.refresh_thread.start()

        last_heartbeat = 0
        
        log("✓ GridPass Client started")
        self._speak("GridPass Client Ready.")
        
        # Open Control Panel automatically
        try:
             base_url = config.API_BASE_URL.replace("/api", "")
             if base_url.endswith("/"): base_url = base_url[:-1]
             panel_url = f"{base_url}/sim-racing/devices/{self.device_manager.device_id}"
             log(f"Opening Control Panel: {panel_url}")
             webbrowser.open(panel_url)
        except Exception as e:
             log(f"Could not open browser: {e}")

        # log(f"✓ Active modules: {', '.join(self.modules.keys()) or 'None'}")
        
        while self.running:
            try:
                # Update all modules
                for module in self.modules.values():
                    module.update()
                
                # Send heartbeat and get commands
                current_time = time.time()
                if current_time - last_heartbeat >= config.HEARTBEAT_INTERVAL:
                    # Gather status from all modules
                    module_status = {
                        name: module.get_status() 
                        for name, module in self.modules.items()
                    }
                    
                    response = self.device_manager.heartbeat(
                        self.auth_token,
                        telemetry=module_status
                    )
                    
                    commands = response.get("commands", [])
                    
                    if commands:
                        log(f"📨 Received {len(commands)} command(s)")
                        
                    # Execute commands (route to appropriate module)
                    for cmd in commands:
                        self.execute_command(cmd)
                    
                    last_heartbeat = current_time
                
                time.sleep(0.1)
                
            except KeyboardInterrupt:
                log("Shutting down...")
                self.running = False
                break
            
            except Exception as e:
                log(f"✗ Error: {e}")
                time.sleep(5)
        
        # Cleanup
        for module in self.modules.values():
            module.stop()
        
        log("Goodbye!")

    def _perform_update_check(self, silent=True):
        import requests
        try:
             # Check version.txt
             base_url = config.API_BASE_URL.replace("/api", "")
             resp = requests.get(f"{base_url}/version.txt", timeout=5)
             
             if resp.status_code == 200:
                 remote_ver = resp.text.strip()
                 try:
                     with open("version.txt", "r") as f:
                         local_ver = f.read().strip()
                 except:
                     local_ver = "0"

                 if remote_ver > local_ver:
                     if not silent: print(f"\n🚀 Update Available: {remote_ver}")
                     
                     # Safety Check: Don't restart if driving
                     sim_module = self.modules.get("sim_racing")
                     safe_to_restart = True
                     
                     if sim_module and sim_module.connected:
                          if getattr(sim_module, 'is_on_track', False):
                              safe_to_restart = False
                     
                     if not safe_to_restart:
                          if not silent: print("   (Update queued - you are driving!)")
                          return False
                     else:
                          if not silent: print("   Restarting in 10s update...")
                          self._speak("Update found. Restarting client.")
                          time.sleep(5)
                          self.restart_required = True
                          self.running = False # Exit main loop
                          return True
        except:
             pass
        return False

    def _check_updates_background(self):
        """Check for updates periodically (Every 60s)"""
        while self.running:
            try:
                # Initial wait + Loop wait
                for _ in range(60): # 1 min check interval
                    if not self.running: return
                    time.sleep(1)
                
                self._perform_update_check(silent=True)

            except Exception as e:
                # Silent fail on update check
                pass



    def _refresh_token_loop(self):
        """Keep token fresh"""
        while self.running:
            time.sleep(60) # Check every minute
            # get_token will refresh if close to expiry (within 5 mins)
            # But wait, get_token reads from disk.
            # If the file hasn't changed, it relies on 'expires_at' in file.
            # We trust auth_flow logic.
            try:
                new_token = self.auth_manager.get_token()
                if new_token and new_token != self.auth_token:
                    self.auth_token = new_token
                    # Update modules
                    if self.modules.get("sim_racing"):
                        self.modules["sim_racing"].auth_token = new_token
                    print("DEBUG: Token refreshed and updated in modules")
            except:
                pass

    def execute_command(self, command: dict):
        """Route command to appropriate module"""
        command_type = command.get("command_type")
        
        # Determine which module handles this command
        # For now, sim racing commands go to sim_racing module
        sim_racing_commands = ["reset_car", "enter_car", "exit_car", "ignition", "pit_limiter"]
        
        if command_type in sim_racing_commands and "sim_racing" in self.modules:
            print(f"⚡ [Sim Racing] Executing: {command_type}")
            result = self.modules["sim_racing"].execute_command(command)
            
            if result['success']:
                print(f"✓ Command completed")
                
                # Check update on Exit
                if command_type == "exit_car":
                     self._perform_update_check(silent=False)
            else:
                print(f"✗ Command failed: {result.get('error_message')}")
        
        elif command_type == "restart_client":
            print("To receive a restart, we will exit with 42")
            print("♻️  Remote Restart Requested...")
            self.restart_required = True
            self.running = False # Exit loop

        elif command_type == "set_environment":
            env = command.get("payload", {}).get("env", "production") 
            local_url = command.get("payload", {}).get("local_url", "http://192.168.86.53:3000/api") # Default to known local
            
            print(f"⚙️  Switching Environment to: {env}")
            
            try:
                local_config_path = os.path.join(os.path.dirname(__file__), "config_local.py")
                
                if env == "local":
                    with open(local_config_path, "w") as f:
                        f.write(f'API_BASE_URL = "{local_url}"\n')
                    print(f"   Created config_local.py pointing to {local_url}")
                    self._speak("Switching to Local Mode. Restarting.")
                else:
                    if os.path.exists(local_config_path):
                        os.remove(local_config_path)
                    print("   Removed config_local.py (Defaulting to Production)")
                    self._speak("Switching to Production Mode. Restarting.")
                    
                time.sleep(2)
                self.restart_required = True
                self.running = False
            except Exception as e:
                print(f"✗ Failed to switch environment: {e}")
            
        # Future: route to other modules
        # elif command_type in file_sync_commands:
        #     self.modules["file_sync"].execute_command(command)


    def start(self):
        log("Starting GridPass Client Lifecycle...")
        
        # Run entire lifecycle in thread so UI isn't blocked
        self.lifecycle_thread = threading.Thread(target=self._lifecycle_loop, daemon=True)
        self.lifecycle_thread.start()

    def _lifecycle_loop(self):
        """Manages login, registration, and main loop sequentially"""
        
        if not self.login():
            log("Login failed or cancelled.")
            # We can retry in loop or just wait?
            # For now, just wait a bit and retry?
            # Actually, if login fails (e.g. no internet), we should retry loop.
            pass

        if self.auth_token and not self.device_manager.device_id:
             if not self.register_device():
                 log("Device registration failed.")
                 pass

        if self.auth_token and self.device_manager.device_id:
             self.initialize_modules()
             self.check_loop() # This blocks until stop()

    def stop(self):
        self.running = False

def create_image():
    # Load icon from file or generate default
    icon_path = os.path.join(config.BASE_PATH, "icon.png")
    log(f"DEBUG: Looking for icon at: {icon_path}")
    
    if os.path.exists(icon_path):
        log("DEBUG: Icon file found.")
        try:
             return Image.open(icon_path)
        except Exception as e:
             log(f"DEBUG: Failed to load icon: {e}")

    log("DEBUG: generating default icon")
    # Generate simple icon (blue square)
    from PIL import ImageDraw
    width = 64
    height = 64
    color1 = (0, 128, 255)
    color2 = (255, 255, 255)
    image = Image.new('RGB', (width, height), color1)
    dc = ImageDraw.Draw(image)
    dc.rectangle((width // 2, 0, width, height // 2), fill=color2)
    dc.rectangle((0, height // 2, width // 2, height), fill=color2)
    return image

def main():
    import sys
    from status_ui import StatusWindow
    
    # 1. Init Client (Logic)
    client = GridPassClient()
    
    # 2. Init UI (Main Thread)
    # We need a way to stop the text-based quit from confusing things, 
    # but now quit is handled by UI or Tray.
    
    def on_quit_app():
        client.stop()
        icon.stop()
        sys.exit(0)

    window = StatusWindow(client, on_quit_app)
    
    # 3. Tray Icon (Background Thread)
    def on_quit(icon, item):
        on_quit_app()

    def on_open_dashboard(icon, item):
        window.open_dashboard()
    
    def on_show_status(icon, item):
        window.show_window()

    image = create_image()
    
    # Simple menu for tray
    menu = pystray.Menu(
        pystray.MenuItem('Show Status', on_show_status, default=True),
        pystray.MenuItem('Open Dashboard', on_open_dashboard),
        pystray.MenuItem('Quit', on_quit)
    )

    icon = pystray.Icon("GridPass", image, "GridPass Client", menu=menu)
    
    # Hook up callbacks
    def update_ui_wrapper():
        # Trigger window update if needed, though window polls client state.
        # But we might want to force show window on new code?
        if client.pairing_code:
             # We want to show the window automatically if pairing is needed?
             # But we can't do it from background thread safely in tkinter.
             # We rely on polling or thread-safe queue. 
             # For simpler approach, let the polling handle it.
             pass
    
    client.set_menu_updater(update_ui_wrapper)
    
    # 4. Start Client Logic (Background Thread)
    # Note: start() now spawns a thread for login/register/loop
    client.start()

    # 5. Start Tray (Background Thread)
    tray_thread = threading.Thread(target=icon.run, daemon=True)
    tray_thread.start()
    
    log("System Tray & UI started.")
    
    # 6. Run UI Main Loop (Blocking Main Thread)
    try:
        window.run()
    except KeyboardInterrupt:
        on_quit_app()

if __name__ == "__main__":
    main()
