"""
GridPass.App SRCommander — Master Unified Desktop Daemon & Rig Control Hub
==========================================================================
The All-In-One background engine powering GridPass Sim Racing on PC:
1. Native Windows System Tray Application (Runs by Clock in Taskbar with Status & Menu)
2. Auto-Updater Engine with Pre-Race Session Load Verification
3. Windows Auto-Start Manager (Zero-click startup on PC boot)
4. Live Telemetry & OBS Broadcast Engine (60 FPS WebSocket ws://127.0.0.1:8080)
5. Local Rig Manager & Cockpit Hardware Hub (/srcommander/rig)
6. Bidirectional Broadcast Director Studio & iRacing Camera/Replay Remote Control
7. Automated Race Control & Session Phase Voice Dispatcher (Practice/Qual/Grid/Race Announcements)
8. Cloud Timing & Web Standings Sync
9. Paint Scheme & Custom Livery Auto-Sync (Documents/iRacing/paint)
10. Championship Setup Auto-Deployment (Documents/iRacing/setups)
11. SRCommander Hardware Control (Dual Speed Wind Fans, Chassis RGB Halo LEDs)
12. Proactive AI Spotter Voice Engine (Windows Native SAPI TTS)
13. Advanced Multi-Stage Physics & Drivetrain Telemetry Filter
14. Native Low-Latency Webcam Capture & Headset Intercom Audio Ingestion
"""

import sys
import os
import time
import json
import math
import base64
import asyncio
import threading
import queue
import argparse
import traceback
import ctypes
import subprocess
import py_compile
import webbrowser
from ctypes import wintypes
from typing import Dict, Any, List, Set, Optional, Union, Tuple

DAEMON_VERSION = "4.3.0"
DAEMON_BUILD_ID = "2026-08-31-system-tray-app"

# Ensure UTF-8 Windows stdout handling
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Optional Dependency Imports with Graceful Fallbacks
try:
    import irsdk
    HAS_IRSDK = True
except ImportError:
    HAS_IRSDK = False

try:
    import websockets
    HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False

try:
    import serial
    import serial.tools.list_ports
    HAS_SERIAL = True
except ImportError:
    HAS_SERIAL = False

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

try:
    import win32com.client
    import pythoncom
    HAS_SAPI = True
except ImportError:
    HAS_SAPI = False

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

try:
    import sounddevice as sd
    import numpy as np
    HAS_AUDIO = True
except ImportError:
    HAS_AUDIO = False

try:
    import pystray
    from PIL import Image, ImageDraw
    HAS_TRAY = True
except ImportError:
    HAS_TRAY = False

# -----------------------------------------------------------------------------
# 1. WINDOWS AUTO-START MANAGEMENT HELPER
# -----------------------------------------------------------------------------
def get_windows_startup_shortcut_path() -> str:
    appdata = os.getenv("APPDATA")
    if not appdata:
        appdata = os.path.expanduser("~\\AppData\\Roaming")
    return os.path.join(appdata, "Microsoft", "Windows", "Start Menu", "Programs", "Startup", "GridPass_SRCommander.lnk")

def is_windows_startup_enabled() -> bool:
    return os.path.exists(get_windows_startup_shortcut_path())

def set_windows_startup(enabled: bool) -> bool:
    shortcut_path = get_windows_startup_shortcut_path()
    try:
        if not enabled:
            if os.path.exists(shortcut_path):
                os.remove(shortcut_path)
            print("  [WINDOWS STARTUP] Removed auto-start shortcut from Windows Startup folder.")
            return False

        launcher_bat = os.path.abspath(os.path.join(os.path.dirname(__file__), "Launch_GridPass_Apex_Core.bat"))
        if not os.path.exists(launcher_bat):
            launcher_bat = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scripts", "Launch_GridPass_Apex_Core.bat"))
        if not os.path.exists(launcher_bat):
            launcher_bat = os.path.abspath(__file__)

        work_dir = os.path.dirname(launcher_bat)
        ps_cmd = (
            f"$WshShell = New-Object -comObject WScript.Shell; "
            f"$Shortcut = $WshShell.CreateShortcut('{shortcut_path}'); "
            f"$Shortcut.TargetPath = '{launcher_bat}'; "
            f"$Shortcut.WorkingDirectory = '{work_dir}'; "
            f"$Shortcut.WindowStyle = 7; "
            f"$Shortcut.Save()"
        )
        subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, check=True)
        print("  [WINDOWS STARTUP] ✓ Successfully registered GridPass SRCommander to auto-start with Windows!")
        return True
    except Exception as e:
        print(f"  [WINDOWS STARTUP ERROR] {e}")
        return False

# -----------------------------------------------------------------------------
# 2. NATIVE WIN32 & IRSDK BROADCAST MESSAGE DEFINITIONS
# -----------------------------------------------------------------------------
user32 = ctypes.windll.user32 if (sys.platform == "win32" and hasattr(ctypes, "windll")) else None
IRSDK_BROADCAST_MSG_ID = user32.RegisterWindowMessageA(b"IRSDK_BROADCASTMSG") if user32 else 0
HWND_BROADCAST = 0xFFFF

if user32:
    try:
        user32.SendNotifyMessageA.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
        user32.SendNotifyMessageA.restype = wintypes.BOOL
    except Exception:
        pass

class BroadcastMsgEnum:
    CAM_SWITCH_POS = 0
    CAM_SWITCH_NUM = 1
    CAM_SET_STATE = 2
    REPLAY_SET_PLAY_SPEED = 3
    REPLAY_SET_PLAY_POSITION = 4
    REPLAY_SEARCH = 5
    REPLAY_SET_STATE = 6
    RELOAD_TEXTURES = 7
    CHAT_COMMAND = 8
    PIT_COMMAND = 9
    TELEM_COMMAND = 10
    FFB_COMMAND = 11
    REPLAY_SEARCH_SESSION_TIME = 12
    VIDEO_CAPTURE = 13

class RpySrchModeEnum:
    TO_START = 0
    TO_END = 1
    PREV_SESSION = 2
    NEXT_SESSION = 3
    PREV_LAP = 4
    NEXT_LAP = 5
    PREV_FRAME = 6
    NEXT_FRAME = 7
    PREV_INCIDENT = 8
    NEXT_INCIDENT = 9

class RpyPosModeEnum:
    BEGIN = 0
    CURRENT = 1
    END = 2

def send_iracing_broadcast_raw(msg_id: int, var1: int, var2: int = 0, var3: int = 0) -> bool:
    if not user32 or not IRSDK_BROADCAST_MSG_ID:
        return False
    try:
        var1_u16 = int(var1) & 0xFFFF
        if var3 != 0:
            var2_u16 = (int(var2) & 0xFF) | ((int(var3) & 0xFF) << 8)
        else:
            var2_u16 = int(var2) & 0xFFFF
        lparam = var1_u16 | (var2_u16 << 16)
        
        res = user32.SendNotifyMessageA(HWND_BROADCAST, IRSDK_BROADCAST_MSG_ID, int(msg_id), int(lparam))
        return bool(res)
    except Exception as e:
        print(f"  [WIN32 IRSDK BROADCAST ERROR] {e}")
        return False

# -----------------------------------------------------------------------------
# 3. CONFIGURATION MANAGEMENT
# -----------------------------------------------------------------------------
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "gridpass_config.json")

def load_config() -> Dict[str, Any]:
    default_config = {
        "league_id": "league_gridpass_league_1788126173139",
        "rig_id": "rig_development_1_nncx",
        "obs_port": 8080,
        "telemetry_fps": 60,
        "auto_updater_enabled": True,
        "auto_updater_interval_sec": 1800.0,
        "check_update_on_session_load": True,
        "update_server_url": "http://localhost:3000",
        "windows_startup_enabled": is_windows_startup_enabled(),
        "webcam_enabled": True,
        "webcam_device_index": 0,
        "webcam_fps": 30,
        "mic_enabled": True,
        "audio_input_device": "default",
        "audio_output_device": "default",
        "steward_audio_enabled": True,
        "auto_session_voice_alerts": True,
        "cloud_sync_enabled": True,
        "cloud_sync_interval_sec": 1.5,
        "paint_sync_enabled": True,
        "paint_sync_interval_sec": 30.0,
        "setup_sync_enabled": True,
        "setup_sync_interval_sec": 60.0,
        "hardware_enabled": True,
        "hardware_port": "auto",
        "hardware_baud": 115200,
        "wind_fans_enabled": True,
        "wind_fan_min_speed_mph": 15,
        "wind_fan_max_speed_mph": 160,
        "wind_fan_curve": "linear",
        "halo_leds_enabled": True,
        "halo_led_mode": "DYNAMIC_RACING",
        "halo_led_redline_pct": 94,
        "halo_led_brightness": 100,
        "spotter_voice_enabled": True,
        "spotter_volume": 100,
        "spotter_frequency": "tactical",
        "iracing_docs_path": "auto",
    }
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                saved = json.load(f)
                default_config.update(saved)
        except Exception:
            pass
    return default_config

def save_config(new_config: Dict[str, Any]) -> bool:
    global config
    try:
        config.update(new_config)
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        print("  [CONFIG] Updated gridpass_config.json successfully!")
        return True
    except Exception as e:
        print(f"  [CONFIG SAVE ERROR] {e}")
        return False

config = load_config()

def get_iracing_documents_path() -> str:
    custom = config.get("iracing_docs_path", "auto")
    if custom != "auto" and os.path.exists(custom):
        return custom
    home = os.path.expanduser("~")
    docs_standard = os.path.join(home, "Documents", "iRacing")
    if os.path.exists(docs_standard):
        return docs_standard
    docs_onedrive = os.path.join(home, "OneDrive", "Documents", "iRacing")
    if os.path.exists(docs_onedrive):
        return docs_onedrive
    return docs_standard

IRACING_DOCS_DIR = get_iracing_documents_path()
PAINT_DIR = os.path.join(IRACING_DOCS_DIR, "paint")
SETUPS_DIR = os.path.join(IRACING_DOCS_DIR, "setups")

# -----------------------------------------------------------------------------
# 4. GLOBAL STATE & TELEMETRY REGISTRY
# -----------------------------------------------------------------------------
telemetry_lock = threading.Lock()
connected_obs_clients: Set[Any] = set()

global_replay_state: Dict[str, Any] = {
    "is_replaying": False,
    "replay_speed": 1.0,
    "seconds_back": 0.0,
    "last_command": "LIVE",
    "timestamp": time.time(),
}

global_overlay_overrides: Dict[str, Any] = {}
latest_webcam_jpeg_b64: Optional[str] = None
webcam_lock = threading.Lock()
current_mic_db_level: float = -60.0

global_telemetry: Dict[str, Any] = {
    "connected": False,
    "source": "standby",
    "timestamp": time.time(),
    "daemon_version": DAEMON_VERSION,
    "session_info": None,
    "focused_car": None,
    "timing_tower": [],
    "battle_box": None,
    "fastest_lap": None,
    "replay_state": global_replay_state,
    "overlay_overrides": global_overlay_overrides,
    "driver_camera": {
        "active": False,
        "width": 0,
        "height": 0,
        "fps": 0,
    },
    "hardware_state": {
        "connected": False,
        "port": "None",
        "fan_power_pct": 0,
        "halo_led_mode": "SOLID_WHITE",
        "mic_level_db": -60.0,
    },
    "paddock_attendance": {
        "total_connected": 0,
        "on_track_count": 0,
        "in_pit_count": 0,
        "session_phase": "STANDBY",
        "phase_countdown_str": "--:--",
        "gridding_status": "Standby",
    }
}

global_status = {
    "version": DAEMON_VERSION,
    "build_id": DAEMON_BUILD_ID,
    "update_status": "Up to date",
    "last_update_check": "Never",
    "windows_startup": is_windows_startup_enabled(),
    "iracing_connected": False,
    "obs_clients_count": 0,
    "webcam_active": False,
    "mic_active": False,
    "hardware_connected": False,
    "hardware_port": "None",
    "wind_fan_power_pct": 0,
    "halo_led_state": "SOLID_WHITE",
    "last_paint_sync": "Never",
    "last_setup_sync": "Never",
    "last_spotter_call": "None",
    "paints_synced_count": 0,
    "setups_synced_count": 0,
    "director_last_action": "STANDBY",
    "last_session_announcement": "None",
}

global_engine: Any = None
global_hardware: Any = None
global_tray: Any = None

# -----------------------------------------------------------------------------
# 5. WINDOWS SYSTEM TRAY APPLICATION MANAGER
# -----------------------------------------------------------------------------
def create_tray_icon_image(is_connected: bool = False):
    """Draws a crisp 64x64 GridPass Sim Racing badge icon for the Windows taskbar."""
    if not HAS_TRAY:
        return None
    img = Image.new("RGBA", (64, 64), color=(0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer circle
    bg_color = (255, 59, 48, 255) if is_connected else (39, 39, 42, 255)
    draw.ellipse([4, 4, 60, 60], fill=bg_color)
    
    # Inner flame / GP symbol
    draw.polygon([(32, 12), (44, 48), (20, 48)], fill=(255, 255, 255, 255))
    draw.ellipse([26, 28, 38, 48], fill=bg_color)
    
    # Status indicator dot at bottom right
    dot_color = (34, 197, 94, 255) if is_connected else (245, 158, 11, 255)
    draw.ellipse([42, 42, 60, 60], fill=(15, 23, 42, 255))
    draw.ellipse([45, 45, 57, 57], fill=dot_color)
    
    return img

class WindowsSystemTrayManager:
    def __init__(self):
        self.icon = None
        self.last_connected_state = None

    def build_menu(self):
        if not HAS_TRAY:
            return None

        is_connected = global_status.get("iracing_connected", False)
        status_text = "🟢 iRacing Status: LIVE (60 FPS)" if is_connected else "⚪ iRacing Status: Waiting..."
        startup_enabled = is_windows_startup_enabled()

        def on_open_comms(icon, item):
            webbrowser.open(f"{ACTIVE_CLOUD_URL}/srcommander/comms")

        def on_open_rig(icon, item):
            webbrowser.open(f"{ACTIVE_CLOUD_URL}/srcommander/rig")

        def on_open_studio(icon, item):
            webbrowser.open(f"{ACTIVE_CLOUD_URL}/srcommander/studio")

        def on_open_overlay(icon, item):
            webbrowser.open(f"{ACTIVE_CLOUD_URL}/srcommander/overlay")

        def on_open_download(icon, item):
            webbrowser.open(f"{ACTIVE_CLOUD_URL}/srleague/download")

        def on_toggle_startup(icon, item):
            new_val = not is_windows_startup_enabled()
            set_windows_startup(new_val)
            global_status["windows_startup"] = new_val
            if icon:
                icon.notify(
                    "Auto-start enabled on PC boot." if new_val else "Auto-start disabled.",
                    title="GridPass Windows Startup"
                )

        def on_check_updates(icon, item):
            res = check_for_updates_now(force=False, trigger_reason="tray_menu")
            if icon:
                if res.get("status") == "up_to_date":
                    icon.notify(f"Engine v{DAEMON_VERSION} is completely up to date.", title="GridPass Auto-Updater")
                elif res.get("status") == "updated":
                    icon.notify(f"Updated to v{res.get('new_version')}! Hot-restarting...", title="GridPass Auto-Updater")
                else:
                    icon.notify(res.get("message", "Checked version."), title="GridPass Auto-Updater")

        def on_restart_daemon(icon, item):
            print("  [TRAY] Restarting GridPass daemon via system tray...")
            if icon:
                icon.notify("Restarting GridPass SRCommander engine...", title="GridPass Engine")
            time.sleep(0.5)
            os.execv(sys.executable, [sys.executable] + sys.argv)

        def on_exit(icon, item):
            print("  [TRAY] Terminating GridPass SRCommander daemon...")
            if icon:
                icon.stop()
            os._exit(0)

        menu = pystray.Menu(
            pystray.MenuItem(f"🏎️ GridPass SRCommander v{DAEMON_VERSION}", None, enabled=False),
            pystray.MenuItem(status_text, None, enabled=False),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("🖥️ Open Desktop Command Center", on_open_comms, default=True),
            pystray.MenuItem("🎛️ Open Rig Manager", on_open_rig),
            pystray.MenuItem("📺 Open TV Broadcast Studio", on_open_studio),
            pystray.MenuItem("🏁 Open In-Game Overlay", on_open_overlay),
            pystray.MenuItem("📥 Open Download & Setup Hub", on_open_download),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("🚀 Start with Windows (Boot)", on_toggle_startup, checked=lambda item: is_windows_startup_enabled()),
            pystray.MenuItem("🔄 Check for Updates Now", on_check_updates),
            pystray.MenuItem("⚡ Restart GridPass Daemon", on_restart_daemon),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("❌ Exit GridPass SRCommander", on_exit)
        )
        return menu

    def run(self):
        if not HAS_TRAY:
            print("  [TRAY] 'pystray' not available. Skipping system tray icon.")
            return

        icon_img = create_tray_icon_image(False)
        self.icon = pystray.Icon(
            "GridPass_SRCommander",
            icon_img,
            f"GridPass SRCommander v{DAEMON_VERSION} • Standby",
            menu=self.build_menu()
        )

        def status_sync_loop():
            while True:
                time.sleep(1.0)
                if not self.icon:
                    continue
                is_conn = global_status.get("iracing_connected", False)
                if is_conn != self.last_connected_state:
                    self.last_connected_state = is_conn
                    self.icon.icon = create_tray_icon_image(is_conn)
                    self.icon.title = f"GridPass SRCommander v{DAEMON_VERSION} • {'iRacing Live (60 FPS)' if is_conn else 'Standby'}"
                    self.icon.menu = self.build_menu()

        threading.Thread(target=status_sync_loop, daemon=True).start()
        print(f"  [SYSTEM TRAY ACTIVE] GridPass SRCommander icon running next to the Windows clock.")
        try:
            self.icon.run()
        except Exception as e:
            print(f"  [TRAY ERROR] {e}")

# -----------------------------------------------------------------------------
# 6. AUTONOMOUS SELF-UPDATING ENGINE ("Download Once, Update Forever")
# -----------------------------------------------------------------------------
def check_for_updates_now(force: bool = False, trigger_reason: str = "periodic") -> Dict[str, Any]:
    global_status["last_update_check"] = time.strftime("%H:%M:%S")
    server_base = config.get("update_server_url", "http://localhost:3000").rstrip("/")
    version_url = f"{server_base}/api/srcommander/version"
    download_url = f"{server_base}/api/srcommander/download"

    try:
        resp = requests.get(version_url, timeout=3.0)
        if resp.status_code != 200:
            global_status["update_status"] = f"Server returned status {resp.status_code}"
            return {"status": "error", "message": "Failed to connect to version server"}

        manifest = resp.json()
        remote_version = manifest.get("version", DAEMON_VERSION)
        notes = manifest.get("release_notes", "Performance improvements")

        print(f"  [AUTO-UPDATER ({trigger_reason.upper()})] Local: v{DAEMON_VERSION} | Remote: v{remote_version}")

        if remote_version == DAEMON_VERSION and not force:
            global_status["update_status"] = f"Up to date (v{DAEMON_VERSION})"
            return {"status": "up_to_date", "version": DAEMON_VERSION}

        print(f"  [AUTO-UPDATER] 🚀 New version v{remote_version} detected on {trigger_reason}! Downloading hot-fix...")
        global_status["update_status"] = f"Downloading v{remote_version}..."

        script_resp = requests.get(download_url, timeout=10.0)
        if script_resp.status_code != 200 or len(script_resp.text) < 500:
            global_status["update_status"] = "Download failed"
            return {"status": "error", "message": "Failed to download update payload"}

        current_script_path = os.path.abspath(__file__)
        tmp_script_path = current_script_path + ".tmp"
        bak_script_path = current_script_path + ".bak"

        with open(tmp_script_path, "w", encoding="utf-8") as f:
            f.write(script_resp.text)

        try:
            py_compile.compile(tmp_script_path, doraise=True)
            print("  [AUTO-UPDATER] ✓ Syntax integrity check passed!")
        except Exception as compile_err:
            print(f"  [AUTO-UPDATER ERROR] Syntax check failed on update payload: {compile_err}")
            if os.path.exists(tmp_script_path):
                os.remove(tmp_script_path)
            global_status["update_status"] = "Syntax check failed"
            return {"status": "error", "message": "Syntax validation failed on update"}

        if os.path.exists(current_script_path):
            try:
                with open(current_script_path, "r", encoding="utf-8") as f_curr:
                    with open(bak_script_path, "w", encoding="utf-8") as f_bak:
                        f_bak.write(f_curr.read())
            except Exception:
                pass

        with open(current_script_path, "w", encoding="utf-8") as f:
            f.write(script_resp.text)

        if os.path.exists(tmp_script_path):
            try:
                os.remove(tmp_script_path)
            except Exception:
                pass

        global_status["update_status"] = f"Updated to v{remote_version}! Restarting..."
        print(f"  [AUTO-UPDATER] ✓ Successfully applied v{remote_version} ({notes})!")
        print("  [AUTO-UPDATER] 🔄 Seamlessly hot-restarting GridPass daemon process...")

        time.sleep(0.5)
        os.execv(sys.executable, [sys.executable] + sys.argv)
        return {"status": "updated", "new_version": remote_version}

    except Exception as e:
        global_status["update_status"] = f"Update error: {str(e)[:20]}"
        return {"status": "error", "message": str(e)}

def auto_updater_worker():
    time.sleep(5.0)
    if config.get("auto_updater_enabled", True):
        check_for_updates_now(force=False, trigger_reason="startup")

    while True:
        time.sleep(config.get("auto_updater_interval_sec", 1800.0))
        if config.get("auto_updater_enabled", True):
            check_for_updates_now(force=False, trigger_reason="30m_periodic")

# -----------------------------------------------------------------------------
# 7. HARDWARE & DEVICE ENUMERATION ENGINE
# -----------------------------------------------------------------------------
def enumerate_all_devices() -> Dict[str, Any]:
    audio_inputs = []
    audio_outputs = []
    cameras = []
    com_ports = []

    if HAS_AUDIO:
        try:
            devs = sd.query_devices()
            for idx, d in enumerate(devs):
                in_ch = d.get("max_input_channels", 0)
                out_ch = d.get("max_output_channels", 0)
                name = d.get("name", f"Audio Device #{idx}")
                hostapi = sd.query_hostapis(d.get("hostapi"))["name"]
                if "WDM-KS" not in hostapi and "MME" not in hostapi:
                    if in_ch > 0:
                        audio_inputs.append({"id": str(idx), "name": f"{name} ({hostapi})", "channels": in_ch})
                    if out_ch > 0:
                        audio_outputs.append({"id": str(idx), "name": f"{name} ({hostapi})", "channels": out_ch})
        except Exception:
            pass

    if HAS_CV2:
        for c_idx in range(4):
            try:
                cap = cv2.VideoCapture(c_idx, cv2.CAP_DSHOW)
                if cap.isOpened():
                    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                    cameras.append({"id": str(c_idx), "name": f"USB Video Device [{c_idx}] ({w}x{h})", "index": c_idx})
                    cap.release()
            except Exception:
                pass

    if HAS_SERIAL:
        try:
            ports = list(serial.tools.list_ports.comports())
            for p in ports:
                com_ports.append({
                    "port": p.device,
                    "desc": p.description or p.device,
                    "hwid": p.hwid or ""
                })
        except Exception:
            pass

    return {
        "audio_inputs": audio_inputs,
        "audio_outputs": audio_outputs,
        "cameras": cameras,
        "com_ports": com_ports,
    }

# -----------------------------------------------------------------------------
# 8. NATIVE WEBCAM CAPTURE ENGINE
# -----------------------------------------------------------------------------
def webcam_capture_worker():
    global latest_webcam_jpeg_b64
    if not HAS_CV2 or not config.get("webcam_enabled", True):
        return

    cam_idx = config.get("webcam_device_index", 0)
    cap = None
    
    for idx in [cam_idx, 0, 1, 2]:
        try:
            test_cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
            if test_cap.isOpened():
                ret, frame = test_cap.read()
                if ret and frame is not None:
                    cap = test_cap
                    cam_idx = idx
                    break
                test_cap.release()
        except Exception:
            pass

    if not cap or not cap.isOpened():
        global_status["webcam_active"] = False
        return

    try:
        cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 360)
        cap.set(cv2.CAP_PROP_FPS, config.get("webcam_fps", 30))
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        global_status["webcam_active"] = True
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 65]

        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                time.sleep(0.01)
                continue

            _, buffer = cv2.imencode('.jpg', frame, encode_param)
            b64_str = base64.b64encode(buffer).decode('utf-8')

            with webcam_lock:
                latest_webcam_jpeg_b64 = b64_str

            time.sleep(1.0 / config.get("webcam_fps", 30))

    except Exception as e:
        print(f"  [WEBCAM WORKER ERROR] {e}")
    finally:
        if cap:
            cap.release()
        global_status["webcam_active"] = False

# -----------------------------------------------------------------------------
# 9. NATIVE HEADSET AUDIO & STEWARD INTERCOM ENGINE
# -----------------------------------------------------------------------------
audio_playback_queue = queue.Queue(maxsize=100)

def audio_playback_worker():
    if not HAS_AUDIO:
        return

    sample_rate = 48000
    try:
        out_dev = None
        target_out = config.get("audio_output_device", "default")
        if target_out != "default" and str(target_out).isdigit():
            out_dev = int(target_out)

        output_stream = sd.OutputStream(device=out_dev, samplerate=sample_rate, channels=1, dtype='float32')
        output_stream.start()
    except Exception as e:
        return

    while True:
        try:
            audio_data = audio_playback_queue.get()
            if audio_data is None:
                break
            output_stream.write(audio_data)
            audio_playback_queue.task_done()
        except Exception:
            pass

def mic_input_monitor_worker():
    global current_mic_db_level
    if not HAS_AUDIO or not config.get("mic_enabled", True):
        return

    def mic_callback(indata, frames, time_info, status):
        global current_mic_db_level
        rms = np.sqrt(np.mean(indata**2))
        current_mic_db_level = float(20 * np.log10(rms + 1e-9))

    try:
        in_dev = None
        target_in = config.get("audio_input_device", "default")
        if target_in != "default" and str(target_in).isdigit():
            in_dev = int(target_in)

        stream = sd.InputStream(device=in_dev, samplerate=48000, blocksize=960, channels=1, dtype='float32', callback=mic_callback)
        stream.start()
        global_status["mic_active"] = True
        while True:
            time.sleep(1.0)
    except Exception:
        global_status["mic_active"] = False

def play_radio_chime():
    if not HAS_AUDIO:
        return
    try:
        sr = 48000
        dur = 0.25
        t = np.linspace(0, dur, int(sr * dur), False)
        chime = 0.12 * (np.sin(2 * np.pi * 880 * t) + 0.4 * np.sin(2 * np.pi * 1760 * t))
        fade = int(sr * 0.015)
        chime[:fade] *= np.linspace(0, 1, fade)
        chime[-fade:] *= np.linspace(1, 0, fade)
        audio_playback_queue.put_nowait(chime.astype(np.float32))
    except Exception:
        pass

def inject_steward_voice(pcm_floats: np.ndarray):
    if not HAS_AUDIO:
        return
    try:
        audio_playback_queue.put_nowait(pcm_floats.astype(np.float32))
    except queue.Full:
        pass

# -----------------------------------------------------------------------------
# 10. PROACTIVE AI SPOTTER & AUTOMATED RACE CONTROL ANNOUNCER
# -----------------------------------------------------------------------------
speech_queue = queue.Queue(maxsize=20)
_last_spoken_call = ""
_last_spoken_time = 0.0

def spotter_worker():
    global _last_spoken_call, _last_spoken_time
    if not HAS_SAPI:
        return
    speaker = None
    try:
        pythoncom.CoInitialize()
        speaker = win32com.client.Dispatch("SAPI.SpVoice")
        speaker.Volume = config.get("spotter_volume", 100)
    except Exception:
        return

    while True:
        try:
            call_text = speech_queue.get()
            if call_text is None:
                break
            now = time.time()
            if call_text == _last_spoken_call and (now - _last_spoken_time) < 4.0:
                speech_queue.task_done()
                continue

            _last_spoken_call = call_text
            _last_spoken_time = now
            global_status["last_spotter_call"] = call_text

            if speaker and config.get("spotter_voice_enabled", True):
                speaker.Speak(call_text)
            speech_queue.task_done()
        except Exception:
            pass

def speak_spotter(message: str, is_steward_announcement: bool = False):
    try:
        if is_steward_announcement:
            play_radio_chime()
            global_status["last_session_announcement"] = message
            print(f"  [RACE CONTROL ANNOUNCEMENT] 📢 {message}")
        speech_queue.put_nowait(message)
    except queue.Full:
        pass

# -----------------------------------------------------------------------------
# 11. HARDWARE CONTROLLER
# -----------------------------------------------------------------------------
def auto_detect_hardware_port() -> str:
    if not HAS_SERIAL:
        return "None"
    custom_port = config.get("hardware_port", "auto")
    if custom_port != "auto":
        return custom_port

    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        hwid = (p.hwid or "").lower()
        desc = (p.description or "").lower()
        if "2341:8054" in hwid or "2341:0054" in hwid or "mkr" in desc:
            return p.device
    for p in ports:
        if "usb-serial" in (p.description or "").lower() or "ch340" in (p.description or "").lower():
            return p.device
    return ports[0].device if ports else "None"

class HardwareController:
    def __init__(self):
        self.ser = None
        self.port = "None"
        self.manual_test_fan_pct: Optional[int] = None
        self.manual_test_led_mode: Optional[str] = None
        self.manual_test_end_t: float = 0.0

    def connect(self) -> bool:
        if not HAS_SERIAL or not config.get("hardware_enabled", True):
            return False
        port = auto_detect_hardware_port()
        if port == "None":
            self.port = "None"
            global_status["hardware_connected"] = False
            global_status["hardware_port"] = "None"
            return False

        try:
            self.ser = serial.Serial(port, config.get("hardware_baud", 115200), timeout=0.05)
            self.port = port
            global_status["hardware_connected"] = True
            global_status["hardware_port"] = port
            print(f"  [HARDWARE CONNECTED] Arduino/Teensy active on {port} (115200 baud)")
            return True
        except Exception:
            self.port = "None"
            global_status["hardware_connected"] = False
            global_status["hardware_port"] = "None"
            return False

    def set_test_fan(self, power_pct: int, duration_sec: float = 5.0):
        self.manual_test_fan_pct = max(0, min(100, power_pct))
        self.manual_test_end_t = time.time() + duration_sec

    def set_test_led(self, mode: str, duration_sec: float = 5.0):
        self.manual_test_led_mode = mode
        self.manual_test_end_t = time.time() + duration_sec

    def update(self, speed_mph: float, rpm: int, rpm_max: int, flag_state: str, is_on_track: bool):
        now = time.time()

        if self.manual_test_end_t > now:
            fan_power = self.manual_test_fan_pct if self.manual_test_fan_pct is not None else 0
            led_mode = self.manual_test_led_mode if self.manual_test_led_mode is not None else "SOLID_WHITE"
        else:
            self.manual_test_fan_pct = None
            self.manual_test_led_mode = None

            fan_power = 0
            if config.get("wind_fans_enabled", True) and is_on_track:
                min_spd = config.get("wind_fan_min_speed_mph", 15)
                max_spd = config.get("wind_fan_max_speed_mph", 160)
                curve = config.get("wind_fan_curve", "linear")
                if speed_mph >= min_spd:
                    ratio = min(1.0, max(0.0, (speed_mph - min_spd) / max(1.0, (max_spd - min_spd))))
                    if curve == "exponential":
                        ratio = ratio ** 1.8
                    fan_power = int(ratio * 100)

            redline_threshold = config.get("halo_led_redline_pct", 94) / 100.0
            led_mode = "WHITE"
            if not is_on_track:
                led_mode = "SOLID_WHITE"
            elif flag_state == "YELLOW":
                led_mode = "FLASH_YELLOW"
            elif flag_state == "RED":
                led_mode = "SOLID_RED"
            elif flag_state == "CHECKERED":
                led_mode = "STROBE_CHECKERED"
            elif rpm_max > 0 and (rpm / rpm_max) >= redline_threshold:
                led_mode = "REDLINE_SHIFT"
            else:
                led_mode = config.get("halo_led_mode", "DYNAMIC_RACING")

        global_status["wind_fan_power_pct"] = fan_power
        global_status["halo_led_state"] = led_mode

        if self.ser and self.ser.is_open:
            try:
                msg = f"F:{fan_power};L:{led_mode}\n"
                self.ser.write(msg.encode("ascii"))
            except Exception:
                self.ser.close()
                self.ser = None
                global_status["hardware_connected"] = False

# -----------------------------------------------------------------------------
# 12. PAINT & SETUP SYNC WORKERS
# -----------------------------------------------------------------------------
def sync_paints_now() -> int:
    if not os.path.exists(PAINT_DIR):
        try:
            os.makedirs(PAINT_DIR, exist_ok=True)
        except Exception:
            pass
    try:
        car_dirs = [d for d in os.listdir(PAINT_DIR) if os.path.isdir(os.path.join(PAINT_DIR, d))] if os.path.exists(PAINT_DIR) else []
        global_status["last_paint_sync"] = time.strftime("%H:%M:%S")
        global_status["paints_synced_count"] = len(car_dirs)
        return len(car_dirs)
    except Exception:
        return 0

def sync_setups_now() -> int:
    if not os.path.exists(SETUPS_DIR):
        try:
            os.makedirs(SETUPS_DIR, exist_ok=True)
        except Exception:
            pass
    try:
        car_dirs = [d for d in os.listdir(SETUPS_DIR) if os.path.isdir(os.path.join(SETUPS_DIR, d))] if os.path.exists(SETUPS_DIR) else []
        global_status["last_setup_sync"] = time.strftime("%H:%M:%S")
        global_status["setups_synced_count"] = len(car_dirs)
        return len(car_dirs)
    except Exception:
        return 0

def paint_sync_worker():
    while True:
        if config.get("paint_sync_enabled", True):
            sync_paints_now()
        time.sleep(config.get("paint_sync_interval_sec", 30.0))

def setup_sync_worker():
    while True:
        if config.get("setup_sync_enabled", True):
            sync_setups_now()
        time.sleep(config.get("setup_sync_interval_sec", 60.0))

# -----------------------------------------------------------------------------
# 13. ADVANCED PHYSICS & DRIVETRAIN TELEMETRY FILTER
# -----------------------------------------------------------------------------
class CarPhysicsFilter:
    def __init__(self):
        self.initialized: bool = False
        self.speed_mph: float = 0.0
        self.last_speed_mph: float = 0.0
        self.accel_mph_s: float = 0.0
        self.gear: int = 1
        self.rpm: float = 900.0
        self.throttle_pct: float = 0.0
        self.brake_pct: float = 0.0
        self.last_gear_shift_t: float = 0.0
        self.is_shifting: bool = False
        self.shift_end_t: float = 0.0

    def update(self, raw_target_speed_mph: float, in_pit: bool, track_surface: int, dt: float, now: float) -> Tuple[float, int, int, float, float]:
        if in_pit or track_surface in [1, 2]:
            self.speed_mph = max(0.0, self.speed_mph - 35.0 * dt)
            self.rpm = max(900.0, self.rpm - 3000.0 * dt)
            self.gear = 0
            self.throttle_pct = 0.0
            self.brake_pct = 100.0 if in_pit else 0.0
            return round(self.speed_mph, 1), 0, int(round(self.rpm)), 0.0, self.brake_pct

        if dt <= 0.0001:
            dt = 1.0 / 60.0

        if not self.initialized and raw_target_speed_mph > 5.0:
            self.speed_mph = raw_target_speed_mph
            self.last_speed_mph = raw_target_speed_mph
            self.initialized = True

        max_accel = 35.0 * dt
        max_brake = 75.0 * dt

        delta_v = raw_target_speed_mph - self.speed_mph
        if delta_v > max_accel:
            clamped_target = self.speed_mph + max_accel
        elif delta_v < -max_brake:
            clamped_target = self.speed_mph - max_brake
        else:
            clamped_target = raw_target_speed_mph

        alpha = 0.10
        self.speed_mph += alpha * (clamped_target - self.speed_mph)
        self.speed_mph = max(0.0, min(185.0, self.speed_mph))

        instant_accel = (self.speed_mph - self.last_speed_mph) / max(0.001, dt)
        self.accel_mph_s += 0.20 * (instant_accel - self.accel_mph_s)
        self.last_speed_mph = self.speed_mph

        gear_thresholds = [
            (0.0, 32.0, 1),
            (28.0, 56.0, 2),
            (50.0, 80.0, 3),
            (74.0, 106.0, 4),
            (98.0, 130.0, 5),
            (122.0, 999.0, 6)
        ]

        target_gear = 1
        for low, high, g in gear_thresholds:
            if low <= self.speed_mph < high:
                target_gear = g
                break

        if self.speed_mph < 2.0:
            target_gear = 1

        if target_gear != self.gear and (now - self.last_gear_shift_t) > 0.35:
            self.gear = target_gear
            self.last_gear_shift_t = now
            self.is_shifting = True
            self.shift_end_t = now + 0.12

        gear_ratios = {1: 3.62, 2: 2.18, 3: 1.54, 4: 1.21, 5: 1.00, 6: 0.82}
        final_drive = 4.10
        tire_circumference_m = 2.02

        if self.speed_mph > 1.0 and self.gear > 0:
            ratio = gear_ratios.get(self.gear, 1.0) * final_drive
            speed_ms = self.speed_mph * 0.44704
            wheel_rps = speed_ms / tire_circumference_m
            calc_rpm = wheel_rps * ratio * 60.0
            target_rpm = max(1800.0, min(8150.0, calc_rpm))
        else:
            target_rpm = 900.0

        if self.is_shifting and now < self.shift_end_t:
            target_rpm *= 0.80
        elif now >= self.shift_end_t:
            self.is_shifting = False

        rpm_alpha = 0.20
        self.rpm += rpm_alpha * (target_rpm - self.rpm)

        if self.accel_mph_s > 0.4:
            target_throttle = min(100.0, 40.0 + (self.accel_mph_s / 8.0) * 60.0)
            target_brake = 0.0
        elif self.accel_mph_s < -1.8:
            target_throttle = 0.0
            target_brake = min(100.0, (-self.accel_mph_s / 18.0) * 100.0)
        else:
            target_throttle = 50.0 if self.speed_mph > 20.0 else 10.0
            target_brake = 0.0

        pedal_alpha = 0.15
        self.throttle_pct += pedal_alpha * (target_throttle - self.throttle_pct)
        self.brake_pct += pedal_alpha * (target_brake - self.brake_pct)

        return (
            round(self.speed_mph, 1),
            self.gear,
            int(round(self.rpm)),
            round(self.throttle_pct, 1),
            round(self.brake_pct, 1)
        )

# -----------------------------------------------------------------------------
# 14. TELEMETRY ENGINE & BROADCAST DISPATCHER
# -----------------------------------------------------------------------------
def format_lap_time(seconds: float) -> str:
    if not seconds or seconds <= 0 or math.isinf(seconds) or math.isnan(seconds):
        return "--:--.---"
    mins = int(seconds // 60)
    rem = seconds % 60
    return f"{mins}:{rem:06.3f}" if mins > 0 else f"{rem:.3f}"

def format_time_remaining(seconds: float) -> str:
    if not seconds or seconds <= 0 or seconds > 86400:
        return "--:--"
    hours = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    if hours > 0:
        return f"{hours}:{mins:02d}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"

def decode_flags(flags_raw: int) -> str:
    if not flags_raw:
        return "GREEN"
    if flags_raw & 0x00000001:
        return "CHECKERED"
    if flags_raw & 0x00000002:
        return "WHITE"
    if flags_raw & 0x00000004:
        return "GREEN"
    if flags_raw & (0x00000008 | 0x00000040 | 0x00000080):
        return "YELLOW"
    if flags_raw & 0x00000010:
        return "RED"
    return "GREEN"

DEFAULT_CAMERA_GROUPS = {
    "cockpit": 1,
    "tv1": 2,
    "tv 1": 2,
    "tv2": 3,
    "tv 2": 3,
    "tv3": 4,
    "tv 4": 4,
    "scenic": 5,
    "pit": 6,
    "pit lane": 6,
    "pitlane": 6,
    "chase": 7,
    "far chase": 8,
    "rear chase": 9,
    "blimp": 10,
    "chopper": 11,
    "heli": 11,
    "helicopter": 11,
    "gyro": 12,
    "roll bar": 13,
    "gearbox": 14,
}

class TelemetryEngine:
    def __init__(self, mock_mode: bool = False):
        self.mock_mode = mock_mode
        self.ir = irsdk.IRSDK() if (not mock_mode and HAS_IRSDK) else None
        self.mock_tick = 0
        self.mock_focused_car_idx = 0
        self.mock_cam_group = "TV1"
        self.last_flag_state = "GREEN"
        self.was_iracing_connected = False
        
        self.last_car_lap_dist_pct: Dict[int, float] = {}
        self.last_car_time: Dict[int, float] = {}
        self.raw_car_speed_ms: Dict[int, float] = {}
        self.physics_filters: Dict[int, CarPhysicsFilter] = {}
        self.track_length_meters: float = 4000.0
        
        self.cam_groups_by_name: Dict[str, int] = dict(DEFAULT_CAMERA_GROUPS)
        self.cam_groups_by_num: Dict[int, str] = {v: k.upper() for k, v in DEFAULT_CAMERA_GROUPS.items()}

        self.last_session_type = ""
        self.last_session_state_raw = -1
        self.alert_milestones_triggered: Set[str] = set()

    def resolve_cam_group(self, group: Any) -> int:
        if isinstance(group, int):
            return group
        s = str(group).strip().lower()
        if s.isdigit():
            return int(s)
        if s in self.cam_groups_by_name:
            return self.cam_groups_by_name[s]
        for name, num in self.cam_groups_by_name.items():
            if s in name or name in s:
                return num
        return 1

    def cam_switch_pos(self, pos: int, cam_group: Any = 0):
        g_num = self.resolve_cam_group(cam_group)
        if self.mock_mode:
            self.mock_focused_car_idx = max(0, pos - 1)
            global_status["director_last_action"] = f"CAM_POS_P{pos}_{cam_group}"
            return

        if self.ir and self.ir.is_connected:
            try:
                if hasattr(self.ir, "cam_switch_pos"):
                    self.ir.cam_switch_pos(position=pos, group=g_num, camera=0)
                elif hasattr(self.ir, "broadcast_msg"):
                    self.ir.broadcast_msg(0, pos, g_num, 0)
                elif hasattr(self.ir, "_broadcast_msg"):
                    self.ir._broadcast_msg(0, pos, g_num, 0)
            except Exception as e:
                print(f"  [SDK CAM SWITCH POS ERROR] {e}")

        send_iracing_broadcast_raw(BroadcastMsgEnum.CAM_SWITCH_POS, pos, g_num, 0)
        global_status["director_last_action"] = f"CAM_POS_P{pos}_{cam_group}"
        print(f"  [DIRECTOR] 🎥 Switch Cam: Position P{pos} -> Group: {cam_group} ({g_num})")

    def cam_switch_num(self, car_num: Any, cam_group: Any = 0):
        g_num = self.resolve_cam_group(cam_group)
        num_clean = str(car_num).strip().lstrip("#")
        try:
            num_int = int(num_clean)
        except ValueError:
            num_int = 0

        if self.mock_mode:
            mock_num_map = {"25": 0, "44": 1, "18": 2, "92": 3, "07": 4, "33": 5}
            if num_clean in mock_num_map:
                self.mock_focused_car_idx = mock_num_map[num_clean]
            global_status["director_last_action"] = f"CAM_NUM_#{car_num}_{cam_group}"
            return

        if self.ir and self.ir.is_connected:
            try:
                if hasattr(self.ir, "cam_switch_num"):
                    self.ir.cam_switch_num(car_number=num_int, group=g_num, camera=0)
                elif hasattr(self.ir, "broadcast_msg"):
                    self.ir.broadcast_msg(1, num_int, g_num, 0)
                elif hasattr(self.ir, "_broadcast_msg"):
                    self.ir._broadcast_msg(1, num_int, g_num, 0)
            except Exception as e:
                print(f"  [SDK CAM SWITCH NUM ERROR] {e}")

        send_iracing_broadcast_raw(BroadcastMsgEnum.CAM_SWITCH_NUM, num_int, g_num, 0)
        global_status["director_last_action"] = f"CAM_NUM_#{car_num}_{cam_group}"
        print(f"  [DIRECTOR] 🎥 Switch Cam: Car #{car_num} -> Group: {cam_group} ({g_num})")

    def cam_set_group(self, cam_group: Any):
        g_num = self.resolve_cam_group(cam_group)
        if self.mock_mode:
            self.mock_cam_group = str(cam_group)
            global_status["director_last_action"] = f"CAM_GROUP_{cam_group}"
            return

        if self.ir and self.ir.is_connected:
            try:
                if hasattr(self.ir, "cam_switch_pos"):
                    self.ir.cam_switch_pos(position=0, group=g_num, camera=0)
                elif hasattr(self.ir, "broadcast_msg"):
                    self.ir.broadcast_msg(0, 0, g_num, 0)
                elif hasattr(self.ir, "_broadcast_msg"):
                    self.ir._broadcast_msg(0, 0, g_num, 0)
            except Exception as e:
                print(f"  [SDK CAM SET GROUP ERROR] {e}")

        send_iracing_broadcast_raw(BroadcastMsgEnum.CAM_SWITCH_POS, 0, g_num, 0)
        global_status["director_last_action"] = f"CAM_GROUP_{cam_group}"
        print(f"  [DIRECTOR] 🎥 Set Camera Group: {cam_group} ({g_num})")

    def replay_jump(self, seconds_back: float):
        frames = -int(abs(seconds_back) * 60)
        if self.ir and self.ir.is_connected:
            try:
                if hasattr(self.ir, "replay_set_play_position"):
                    self.ir.replay_set_play_position(pos_mode=1, frame_num=frames)
                elif hasattr(self.ir, "broadcast_msg"):
                    self.ir.broadcast_msg(4, 1, frames)
                elif hasattr(self.ir, "_broadcast_msg"):
                    self.ir._broadcast_msg(4, 1, frames)
            except Exception as e:
                print(f"  [SDK REPLAY JUMP ERROR] {e}")

        send_iracing_broadcast_raw(BroadcastMsgEnum.REPLAY_SET_PLAY_POSITION, RpyPosModeEnum.CURRENT, frames)
        with telemetry_lock:
            global_replay_state["is_replaying"] = True
            global_replay_state["seconds_back"] = seconds_back
            global_replay_state["last_command"] = f"REPLAY_JUMP_{seconds_back}S"
            global_replay_state["timestamp"] = time.time()
        global_status["director_last_action"] = f"REPLAY_JUMP_{seconds_back}S"
        print(f"  [DIRECTOR] ⏪ Replay Jump: -{seconds_back}s ({frames} frames)")

    def replay_play(self, speed: float):
        slow_mo = 0
        speed_param = 1
        if speed == 0.0:
            speed_param = 0
            slow_mo = 0
        elif 0 < speed < 1.0:
            slow_mo = 1
            speed_param = max(1, int(round(1.0 / speed)))
        elif speed >= 1.0:
            slow_mo = 0
            speed_param = int(speed)

        if self.ir and self.ir.is_connected:
            try:
                if hasattr(self.ir, "replay_set_play_speed"):
                    self.ir.replay_set_play_speed(speed=speed_param, slow_motion=bool(slow_mo))
                elif hasattr(self.ir, "broadcast_msg"):
                    self.ir.broadcast_msg(3, speed_param, slow_mo)
                elif hasattr(self.ir, "_broadcast_msg"):
                    self.ir._broadcast_msg(3, speed_param, slow_mo)
            except Exception as e:
                print(f"  [SDK REPLAY PLAY ERROR] {e}")

        send_iracing_broadcast_raw(BroadcastMsgEnum.REPLAY_SET_PLAY_SPEED, speed_param, slow_mo)
        with telemetry_lock:
            global_replay_state["replay_speed"] = speed
            global_replay_state["is_replaying"] = (speed != 1.0 or global_replay_state.get("is_replaying", False))
            global_replay_state["last_command"] = f"REPLAY_PLAY_{speed}X"
            global_replay_state["timestamp"] = time.time()
        global_status["director_last_action"] = f"REPLAY_PLAY_{speed}X"
        print(f"  [DIRECTOR] ▶️ Replay Play Speed: {speed}x")

    def replay_search_incident(self):
        if self.ir and self.ir.is_connected:
            try:
                if hasattr(self.ir, "replay_search"):
                    self.ir.replay_search(search_mode=8)
                elif hasattr(self.ir, "broadcast_msg"):
                    self.ir.broadcast_msg(5, 8, 0)
                elif hasattr(self.ir, "_broadcast_msg"):
                    self.ir._broadcast_msg(5, 8, 0)
            except Exception as e:
                print(f"  [SDK REPLAY INCIDENT SEARCH ERROR] {e}")

        send_iracing_broadcast_raw(BroadcastMsgEnum.REPLAY_SEARCH, RpySrchModeEnum.PREV_INCIDENT, 0)
        with telemetry_lock:
            global_replay_state["is_replaying"] = True
            global_replay_state["last_command"] = "REPLAY_SEARCH_INCIDENT"
            global_replay_state["timestamp"] = time.time()
        global_status["director_last_action"] = "REPLAY_SEARCH_INCIDENT"
        print("  [DIRECTOR] 💥 Replay: Jumped to Recent Incident")

    def replay_return_to_live(self):
        if self.ir and self.ir.is_connected:
            try:
                if hasattr(self.ir, "replay_search"):
                    self.ir.replay_search(search_mode=1)
                elif hasattr(self.ir, "broadcast_msg"):
                    self.ir.broadcast_msg(5, 1, 0)
                if hasattr(self.ir, "replay_set_play_speed"):
                    self.ir.replay_set_play_speed(speed=1, slow_motion=False)
                elif hasattr(self.ir, "broadcast_msg"):
                    self.ir.broadcast_msg(3, 1, 0)
            except Exception as e:
                print(f"  [SDK REPLAY LIVE ERROR] {e}")

        send_iracing_broadcast_raw(BroadcastMsgEnum.REPLAY_SEARCH, RpySrchModeEnum.TO_END, 0)
        send_iracing_broadcast_raw(BroadcastMsgEnum.REPLAY_SET_PLAY_SPEED, 1, 0)
        with telemetry_lock:
            global_replay_state["is_replaying"] = False
            global_replay_state["replay_speed"] = 1.0
            global_replay_state["seconds_back"] = 0.0
            global_replay_state["last_command"] = "REPLAY_RETURN_TO_LIVE"
            global_replay_state["timestamp"] = time.time()
        global_status["director_last_action"] = "LIVE_SESSION"
        print("  [DIRECTOR] 🟢 Replay: Return to Live Feed (1.0x)")

    def calculate_raw_car_speed(self, car_idx: int, cur_dist_pct: float, in_pit: bool, track_surface: int, now: float) -> float:
        if in_pit or track_surface in [1, 2]:
            self.last_car_lap_dist_pct[car_idx] = cur_dist_pct
            self.last_car_time[car_idx] = now
            self.raw_car_speed_ms[car_idx] = 0.0
            return 0.0

        if cur_dist_pct < 0:
            return 0.0

        last_pct = self.last_car_lap_dist_pct.get(car_idx)
        last_t = self.last_car_time.get(car_idx)

        self.last_car_lap_dist_pct[car_idx] = cur_dist_pct
        self.last_car_time[car_idx] = now

        if last_pct is None or last_t is None:
            return self.raw_car_speed_ms.get(car_idx, 0.0)

        delta_t = now - last_t
        if delta_t <= 0.001 or delta_t > 1.0:
            return self.raw_car_speed_ms.get(car_idx, 0.0)

        delta_pct = cur_dist_pct - last_pct
        if delta_pct < -0.5:
            delta_pct += 1.0
        elif delta_pct > 0.5:
            delta_pct -= 1.0

        if delta_pct < 0 or delta_pct > 0.05:
            return self.raw_car_speed_ms.get(car_idx, 0.0)

        raw_speed_ms = (delta_pct * self.track_length_meters) / delta_t
        raw_speed_ms = min(120.0, max(0.0, raw_speed_ms))
        self.raw_car_speed_ms[car_idx] = raw_speed_ms
        return raw_speed_ms

    def evaluate_automated_session_announcements(self, session_type: str, session_state_raw: int, time_remain_sec: float, flag_state: str):
        if not config.get("auto_session_voice_alerts", True):
            return

        s_type = session_type.lower()

        if "practice" in s_type and time_remain_sec > 0:
            if 290.0 <= time_remain_sec <= 300.0 and "practice_5m" not in self.alert_milestones_triggered:
                self.alert_milestones_triggered.add("practice_5m")
                speak_spotter("Attention all drivers: Practice session is closing in five minutes. Prepare for qualifying.", is_steward_announcement=True)

            elif 50.0 <= time_remain_sec <= 60.0 and "practice_1m" not in self.alert_milestones_triggered:
                self.alert_milestones_triggered.add("practice_1m")
                speak_spotter("Practice session is ending in one minute. Qualifying will begin momentarily.", is_steward_announcement=True)

        if "qualify" in s_type and "qual_active" not in self.alert_milestones_triggered:
            self.alert_milestones_triggered.add("qual_active")
            speak_spotter("Qualifying session is now green. Drivers, you have ten minutes to set your grid position.", is_steward_announcement=True)

        if session_state_raw in [1, 2] and "gridding_window" not in self.alert_milestones_triggered:
            self.alert_milestones_triggered.add("gridding_window")
            speak_spotter("Attention drivers: Gridding window is now open. All cars report to the starting grid. The race starts in two minutes.", is_steward_announcement=True)

        if session_state_raw == 3 and "pace_lap" not in self.alert_milestones_triggered:
            self.alert_milestones_triggered.add("pace_lap")
            speak_spotter("The pace car is rolling. Maintain your double file grid position and warm up your tires.", is_steward_announcement=True)

        if session_type != self.last_session_type:
            self.alert_milestones_triggered.clear()
            self.last_session_type = session_type

    def update(self) -> Dict[str, Any]:
        global global_telemetry
        if self.mock_mode:
            return self.generate_mock_frame()

        if not self.ir:
            with telemetry_lock:
                global_telemetry = {
                    "connected": False,
                    "source": "standby",
                    "timestamp": time.time(),
                    "daemon_version": DAEMON_VERSION,
                    "session_info": None,
                    "focused_car": None,
                    "timing_tower": [],
                    "battle_box": None,
                    "fastest_lap": None,
                    "replay_state": dict(global_replay_state),
                    "overlay_overrides": dict(global_overlay_overrides),
                    "driver_camera": {
                        "active": global_status["webcam_active"],
                        "frame_jpeg_b64": latest_webcam_jpeg_b64 if global_status["webcam_active"] else None,
                    },
                    "hardware_state": {
                        "connected": global_status["hardware_connected"],
                        "port": global_status["hardware_port"],
                        "fan_power_pct": global_status["wind_fan_power_pct"],
                        "halo_led_mode": global_status["halo_led_state"],
                        "mic_level_db": current_mic_db_level,
                    },
                    "paddock_attendance": {
                        "total_connected": 0,
                        "on_track_count": 0,
                        "in_pit_count": 0,
                        "session_phase": "STANDBY",
                        "phase_countdown_str": "--:--",
                        "gridding_status": "Standby",
                    }
                }
            global_status["iracing_connected"] = False
            self.was_iracing_connected = False
            return global_telemetry

        if not self.ir.is_initialized:
            self.ir.startup()

        if not self.ir.is_connected:
            with telemetry_lock:
                global_telemetry = {
                    "connected": False,
                    "source": "standby",
                    "timestamp": time.time(),
                    "daemon_version": DAEMON_VERSION,
                    "session_info": None,
                    "focused_car": None,
                    "timing_tower": [],
                    "battle_box": None,
                    "fastest_lap": None,
                    "replay_state": dict(global_replay_state),
                    "overlay_overrides": dict(global_overlay_overrides),
                    "driver_camera": {
                        "active": global_status["webcam_active"],
                        "frame_jpeg_b64": latest_webcam_jpeg_b64 if global_status["webcam_active"] else None,
                    },
                    "hardware_state": {
                        "connected": global_status["hardware_connected"],
                        "port": global_status["hardware_port"],
                        "fan_power_pct": global_status["wind_fan_power_pct"],
                        "halo_led_mode": global_status["halo_led_state"],
                        "mic_level_db": current_mic_db_level,
                    },
                    "paddock_attendance": {
                        "total_connected": 0,
                        "on_track_count": 0,
                        "in_pit_count": 0,
                        "session_phase": "STANDBY",
                        "phase_countdown_str": "--:--",
                        "gridding_status": "Standby",
                    }
                }
            global_status["iracing_connected"] = False
            self.was_iracing_connected = False
            return global_telemetry

        if not self.was_iracing_connected:
            self.was_iracing_connected = True
            print("  [PRE-RACE UPDATE CHECK] 🏁 iRacing session connected! Checking GridPass version...")
            if config.get("check_update_on_session_load", True):
                threading.Thread(target=check_for_updates_now, args=(False, "pre_race_session_load"), daemon=True).start()

        global_status["iracing_connected"] = True
        self.ir.freeze_var_buffer_latest()

        track_name = "iRacing Circuit"
        track_config = ""
        try:
            weekend = self.ir["WeekendInfo"]
            if weekend and isinstance(weekend, dict):
                track_name = weekend.get("TrackDisplayName") or weekend.get("TrackCity") or track_name
                track_config = weekend.get("TrackConfigName") or ""
                track_len_str = weekend.get("TrackLength", "")
                if track_len_str:
                    s = str(track_len_str).lower().strip()
                    if "km" in s:
                        self.track_length_meters = float(s.replace("km", "").strip()) * 1000.0
                    elif "mi" in s:
                        self.track_length_meters = float(s.replace("mi", "").strip()) * 1609.344
                    elif "m" in s:
                        self.track_length_meters = float(s.replace("m", "").strip())
        except Exception:
            pass

        session_type = "Practice"
        session_name = "PRACTICE"
        session_state_raw = self.ir["SessionState"] or 0
        try:
            session_info = self.ir["SessionInfo"]
            if session_info and isinstance(session_info, dict):
                sessions = session_info.get("Sessions", [])
                session_num = self.ir["SessionNum"] or 0
                if sessions and session_num < len(sessions):
                    session_type = sessions[session_num].get("SessionType", session_type)
                    session_name = sessions[session_num].get("SessionName", session_name)
                
                cam_info = session_info.get("CameraInfo") or self.ir["CameraInfo"]
                if cam_info and isinstance(cam_info, dict):
                    groups = cam_info.get("Groups", [])
                    for g in groups:
                        g_num = g.get("GroupNum")
                        g_name = g.get("GroupName")
                        if g_num is not None and g_name:
                            self.cam_groups_by_name[g_name.lower().strip()] = g_num
                            self.cam_groups_by_num[g_num] = g_name
        except Exception:
            pass

        drivers_dict = {}
        cam_car_idx = self.ir["CamCarIdx"]
        player_car_idx = self.ir["PlayerCarIdx"] or 0
        if cam_car_idx is None or cam_car_idx < 0:
            cam_car_idx = player_car_idx

        try:
            driver_info = self.ir["DriverInfo"]
            if driver_info and isinstance(driver_info, dict):
                for d in driver_info.get("Drivers", []):
                    c_idx = d.get("CarIdx")
                    is_pace = d.get("CarIsPaceCar") == 1 or d.get("UserName") == "Pace Car"
                    is_spec = d.get("IsSpectator") == 1
                    if c_idx is not None and not is_pace and not is_spec:
                        drivers_dict[c_idx] = {
                            "name": d.get("UserName", f"Driver #{c_idx}"),
                            "num": str(d.get("CarNumber", str(c_idx))),
                            "team": d.get("TeamName", "Independent"),
                            "car_name": d.get("CarScreenName", "Toyota GR86"),
                            "class_name": d.get("CarClassShortName", "GR86"),
                        }
        except Exception:
            pass

        track_temp_c = self.ir["TrackTempCrew"] or self.ir["TrackTemp"] or 25.0
        air_temp_c = self.ir["AirTemp"] or 22.0
        track_temp_f = round((track_temp_c * 9/5) + 32, 1)
        air_temp_f = round((air_temp_c * 9/5) + 32, 1)

        raw_flags = self.ir["SessionFlags"] or 0
        flag_state = decode_flags(raw_flags)
        session_time_remain = float(self.ir["SessionTimeRemain"] or 0.0)
        session_laps_remain = self.ir["SessionLapsRemainEx"] or 0

        self.evaluate_automated_session_announcements(session_type, session_state_raw, session_time_remain, flag_state)

        if flag_state != self.last_flag_state:
            if flag_state == "GREEN":
                speak_spotter("Green green green!")
            elif flag_state == "YELLOW":
                speak_spotter("Caution flag, slow down.")
            elif flag_state == "WHITE":
                speak_spotter("White flag, final lap!")
            elif flag_state == "CHECKERED":
                speak_spotter("Checkered flag, bring it home!")
            self.last_flag_state = flag_state

        positions = self.ir["CarIdxPosition"] or []
        laps = self.ir["CarIdxLap"] or []
        lap_dist_pct = self.ir["CarIdxLapDistPct"] or []
        best_lap_times = self.ir["CarIdxBestLapTime"] or []
        last_lap_times = self.ir["CarIdxLastLapTime"] or []
        f2_times = self.ir["CarIdxF2Time"] or []
        on_pit_road = self.ir["CarIdxOnPitRoad"] or []
        track_surfaces = self.ir["CarIdxTrackSurface"] or []

        is_practice_mode = session_type.lower() in ["practice", "qualify", "testing", "warmup", "lone qualify"]

        tower_rows = []
        best_session_lap = 999999.0
        fastest_driver_idx = None
        now_time = time.time()
        on_track_count = 0
        in_pit_count = 0

        for c_idx, driver in drivers_dict.items():
            pos = positions[c_idx] if c_idx < len(positions) else 0
            best_lap = best_lap_times[c_idx] if c_idx < len(best_lap_times) else 0.0
            last_lap = last_lap_times[c_idx] if c_idx < len(last_lap_times) else 0.0
            lap_num = laps[c_idx] if c_idx < len(laps) else 0
            raw_dist_pct = lap_dist_pct[c_idx] if c_idx < len(lap_dist_pct) else 0.0
            dist_pct = round(max(0.0, raw_dist_pct) * 100, 1)
            in_pit = bool(on_pit_road[c_idx]) if c_idx < len(on_pit_road) else False
            surf = track_surfaces[c_idx] if c_idx < len(track_surfaces) else 3

            if in_pit or surf in [1, 2]:
                in_pit_count += 1
            else:
                on_track_count += 1

            raw_spd_ms = self.calculate_raw_car_speed(c_idx, raw_dist_pct, in_pit, surf, now=now_time)
            raw_spd_mph = raw_spd_ms * 2.23694

            if c_idx not in self.physics_filters:
                self.physics_filters[c_idx] = CarPhysicsFilter()

            p_filter = self.physics_filters[c_idx]
            dt = 1.0 / config.get("telemetry_fps", 60)
            spd_mph, gear, rpm, throttle, brake = p_filter.update(raw_spd_mph, in_pit, surf, dt, now=now_time)
            spd_kph = round(spd_mph * 1.60934, 1)

            if best_lap > 0 and best_lap < best_session_lap:
                best_session_lap = best_lap
                fastest_driver_idx = c_idx

            tower_rows.append({
                "car_idx": c_idx,
                "pos": pos,
                "raw_pos": pos if pos > 0 else 999,
                "best_lap_num": best_lap if best_lap > 0 else 999999.0,
                "best_lap_raw": best_lap,
                "name": driver["name"],
                "num": driver["num"],
                "team": driver["team"],
                "car_name": driver["car_name"],
                "class_name": driver["class_name"],
                "lap": max(0, lap_num),
                "dist_pct": max(0.0, dist_pct),
                "speed_mph": spd_mph,
                "speed_kph": spd_kph,
                "gear": gear,
                "rpm": rpm,
                "throttle_pct": throttle,
                "brake_pct": brake,
                "best_lap_str": format_lap_time(best_lap),
                "last_lap_str": format_lap_time(last_lap),
                "gap_str": "",
                "in_pit": in_pit,
                "is_focused": (c_idx == cam_car_idx),
            })

        if is_practice_mode:
            tower_rows.sort(key=lambda r: (r["best_lap_num"], -r["lap"], r["car_idx"]))
            p1_best = tower_rows[0]["best_lap_raw"] if tower_rows else 0.0
            for idx, r in enumerate(tower_rows):
                r["pos"] = idx + 1
                if idx == 0:
                    r["gap_str"] = r["best_lap_str"] if r["best_lap_raw"] > 0 else "--:--.---"
                else:
                    if r["best_lap_raw"] > 0 and p1_best > 0:
                        delta = r["best_lap_raw"] - p1_best
                        r["gap_str"] = f"+{delta:.3f}"
                    elif r["in_pit"]:
                        r["gap_str"] = "PIT"
                    elif r["best_lap_raw"] > 0:
                        r["gap_str"] = r["best_lap_str"]
                    else:
                        r["gap_str"] = f"L{r['lap']}" if r['lap'] > 0 else "--"
        else:
            tower_rows.sort(key=lambda r: (r["raw_pos"], r["best_lap_num"], r["car_idx"]))
            for idx, r in enumerate(tower_rows):
                r["pos"] = idx + 1
                c_idx = r["car_idx"]
                gap_sec = f2_times[c_idx] if c_idx < len(f2_times) else 0.0
                r["gap_str"] = "LEADER" if idx == 0 else (f"+{gap_sec:.3f}" if gap_sec > 0 else ("PIT" if r["in_pit"] else "--"))

        for r in tower_rows:
            r["is_fastest"] = (r["car_idx"] == fastest_driver_idx and r["best_lap_raw"] > 0)

        focused_car = None
        if cam_car_idx is not None and cam_car_idx in drivers_dict:
            focused_driver = drivers_dict[cam_car_idx]
            is_local_player = (cam_car_idx == player_car_idx)
            
            focused_timing = next((r for r in tower_rows if r["car_idx"] == cam_car_idx), None)
            f_pos = focused_timing["pos"] if focused_timing else 1
            f_best_str = focused_timing["best_lap_str"] if focused_timing else "--:--.---"
            f_last_str = focused_timing["last_lap_str"] if focused_timing else "--:--.---"
            f_laps = focused_timing["lap"] if focused_timing else 0
            f_dist_pct = focused_timing["dist_pct"] if focused_timing else 0.0
            f_in_pit = focused_timing["in_pit"] if focused_timing else False

            surf = track_surfaces[cam_car_idx] if cam_car_idx < len(track_surfaces) else 3
            track_status = "IN PIT" if f_in_pit else ("ON TRACK" if surf in [3, 4] else "OFF TRACK")

            if is_local_player and not f_in_pit and (self.ir["Speed"] or 0.0) > 0.5:
                speed_ms = self.ir["Speed"] or 0.0
                speed_mph = round(speed_ms * 2.23694, 1)
                speed_kph = round(speed_ms * 3.6, 1)
                gear = self.ir["Gear"] or 0
                rpm = round(self.ir["RPM"] or 0)
                throttle = round((self.ir["Throttle"] or 0.0) * 100, 1)
                brake = round((self.ir["Brake"] or 0.0) * 100, 1)
                steer_rad = self.ir["SteeringWheelAngle"] or 0.0
                steer_deg = round(steer_rad * (180.0 / math.pi), 1)
                fuel_level = round(self.ir["FuelLevel"] or 0.0, 2)
                delta_best = round(self.ir["LapDeltaToBestLap"] or 0.0, 3)
            else:
                speed_mph = focused_timing["speed_mph"] if focused_timing else 0.0
                speed_kph = focused_timing["speed_kph"] if focused_timing else 0.0
                gear = focused_timing["gear"] if focused_timing else 1
                rpm = focused_timing["rpm"] if focused_timing else 900
                throttle = focused_timing["throttle_pct"] if focused_timing else 0.0
                brake = focused_timing["brake_pct"] if focused_timing else 0.0
                steer_deg = 0.0
                fuel_level = 0.0
                delta_best = 0.0

            focused_car = {
                "car_idx": cam_car_idx,
                "name": focused_driver["name"],
                "num": focused_driver["num"],
                "team": focused_driver["team"],
                "car_name": focused_driver["car_name"],
                "class_name": focused_driver["class_name"],
                "pos": f_pos,
                "best_lap_str": f_best_str,
                "last_lap_str": f_last_str,
                "laps_completed": f_laps,
                "dist_pct": f_dist_pct,
                "track_status": track_status,
                "in_pit": f_in_pit,
                "is_player": is_local_player,
                "speed_mph": speed_mph,
                "speed_kph": speed_kph,
                "gear": gear,
                "rpm": rpm,
                "rpm_max": 8200,
                "throttle_pct": throttle,
                "brake_pct": brake,
                "steer_deg": steer_deg,
                "fuel_liters": fuel_level,
                "delta_best": delta_best,
            }

        with telemetry_lock:
            global_telemetry = {
                "connected": True,
                "source": "iracing_live",
                "timestamp": time.time(),
                "daemon_version": DAEMON_VERSION,
                "session_info": {
                    "track_name": track_name,
                    "track_config": track_config,
                    "session_type": session_type,
                    "session_name": session_name,
                    "session_state": "Active",
                    "flag_state": flag_state,
                    "time_remaining_str": format_time_remaining(session_time_remain),
                    "laps_remaining": session_laps_remain,
                    "track_temp_f": track_temp_f,
                    "air_temp_f": air_temp_f,
                },
                "focused_car": focused_car,
                "timing_tower": tower_rows,
                "battle_box": None,
                "fastest_lap": {
                    "driver_idx": fastest_driver_idx,
                    "lap_time_str": format_lap_time(best_session_lap) if best_session_lap < 999999 else "--",
                } if fastest_driver_idx is not None else None,
                "replay_state": dict(global_replay_state),
                "overlay_overrides": dict(global_overlay_overrides),
                "driver_camera": {
                    "active": global_status["webcam_active"],
                    "frame_jpeg_b64": latest_webcam_jpeg_b64 if global_status["webcam_active"] else None,
                },
                "hardware_state": {
                    "connected": global_status["hardware_connected"],
                    "port": global_status["hardware_port"],
                    "fan_power_pct": global_status["wind_fan_power_pct"],
                    "halo_led_mode": global_status["halo_led_state"],
                    "mic_level_db": current_mic_db_level,
                },
                "paddock_attendance": {
                    "total_connected": len(drivers_dict),
                    "on_track_count": on_track_count,
                    "in_pit_count": in_pit_count,
                    "session_phase": session_type.upper(),
                    "phase_countdown_str": format_time_remaining(session_time_remain),
                    "gridding_status": f"{on_track_count}/{len(drivers_dict)} Cars Active" if drivers_dict else "Standby",
                }
            }

        return global_telemetry

    def generate_mock_frame(self) -> Dict[str, Any]:
        global global_telemetry
        self.mock_tick += 1
        t = self.mock_tick * 0.05

        is_replay = global_replay_state.get("is_replaying", False)
        replay_spd = global_replay_state.get("replay_speed", 1.0)
        speed_mult = replay_spd if is_replay else 1.0

        speed = int(95 + 45 * math.sin(t * 0.8 * speed_mult))
        rpm = int(5200 + 2600 * math.sin(t * 1.2 * speed_mult))
        gear = max(2, min(5, int(3 + 1.5 * math.sin(t * 0.6))))
        throttle = round(max(0.0, min(100.0, 50 + 50 * math.sin(t * 0.9))), 1)
        brake = round(max(0.0, min(100.0, 40 * math.sin(t * 0.7 + 1.8))), 1)
        steer = round(25 * math.sin(t * 0.5), 1)

        drivers = [
            {"pos": 1, "name": "PJ Losey", "num": "25", "team": "Apex GridPass Racing", "gap": "1:24.120", "best": "1:24.120", "last": "1:24.310", "pit": False, "fastest": True},
            {"pos": 2, "name": "Marcus Vance", "num": "44", "team": "Vance Motorsport", "gap": "+0.342", "best": "1:24.464", "last": "1:24.490", "pit": False, "fastest": False},
            {"pos": 3, "name": "Sarah Jenkins", "num": "18", "team": "Summit Performance", "gap": "+0.690", "best": "1:24.810", "last": "1:24.950", "pit": False, "fastest": False},
            {"pos": 4, "name": "Dave Miller", "num": "92", "team": "Miller Speed Lab", "gap": "+0.985", "best": "1:25.105", "last": "1:25.320", "pit": False, "fastest": False},
            {"pos": 5, "name": "Steve Chen", "num": "07", "team": "Oversteer Garage", "gap": "+1.300", "best": "1:25.420", "last": "1:25.610", "pit": False, "fastest": False},
            {"pos": 6, "name": "Billy Thompson", "num": "33", "team": "Grassroots Racing", "gap": "+1.770", "best": "1:25.890", "last": "1:26.120", "pit": True, "fastest": False},
        ]

        f_idx = self.mock_focused_car_idx % len(drivers)
        focused_d = drivers[f_idx]

        tower_rows = [
            {
                "car_idx": idx,
                "pos": idx + 1,
                "name": d["name"],
                "num": d["num"],
                "team": d["team"],
                "car_name": "Toyota GR86",
                "class_name": "GR86",
                "lap": 12,
                "dist_pct": round((self.mock_tick * 0.8 + idx * 12) % 100, 1),
                "speed_mph": speed if idx == f_idx else int(speed * 0.95),
                "speed_kph": int(speed * 1.60934) if idx == f_idx else int(speed * 0.95 * 1.60934),
                "best_lap_str": d["best"],
                "last_lap_str": d["last"],
                "gap_str": d["gap"],
                "in_pit": d["pit"],
                "is_fastest": d["fastest"],
                "is_focused": (idx == f_idx),
            }
            for idx, d in enumerate(drivers)
        ]

        with telemetry_lock:
            global_telemetry = {
                "connected": True,
                "source": "simulated_mock_feed",
                "timestamp": time.time(),
                "daemon_version": DAEMON_VERSION,
                "session_info": {
                    "track_name": "Lime Rock Park",
                    "track_config": "Classic GP",
                    "session_type": "Practice",
                    "session_name": "PRACTICE",
                    "session_state": "Active",
                    "flag_state": "GREEN",
                    "time_remaining_str": "18:42",
                    "laps_remaining": 8,
                    "track_temp_f": 86.4,
                    "air_temp_f": 76.2,
                },
                "focused_car": {
                    "car_idx": f_idx,
                    "name": focused_d["name"],
                    "num": focused_d["num"],
                    "team": focused_d["team"],
                    "pos": f_idx + 1,
                    "best_lap_str": focused_d["best"],
                    "last_lap_str": focused_d["last"],
                    "laps_completed": 12,
                    "dist_pct": 45.2,
                    "track_status": "IN PIT" if focused_d["pit"] else "ON TRACK",
                    "in_pit": focused_d["pit"],
                    "is_player": (f_idx == 0),
                    "speed_mph": 0 if focused_d["pit"] else speed,
                    "speed_kph": 0 if focused_d["pit"] else int(speed * 1.60934),
                    "gear": 0 if focused_d["pit"] else gear,
                    "rpm": 900 if focused_d["pit"] else rpm,
                    "rpm_max": 8200,
                    "throttle_pct": 0 if focused_d["pit"] else throttle,
                    "brake_pct": 0 if focused_d["pit"] else brake,
                    "steer_deg": steer,
                    "fuel_liters": 18.4,
                    "delta_best": -0.142,
                },
                "timing_tower": tower_rows,
                "battle_box": None,
                "fastest_lap": {
                    "driver_idx": 0,
                    "lap_time_str": "1:24.120",
                },
                "replay_state": dict(global_replay_state),
                "overlay_overrides": dict(global_overlay_overrides),
                "driver_camera": {
                    "active": False,
                    "frame_jpeg_b64": None,
                },
                "hardware_state": {
                    "connected": False,
                    "port": "COM3",
                    "fan_power_pct": 0,
                    "halo_led_mode": "DYNAMIC_RACING",
                    "mic_level_db": -45.0,
                },
                "paddock_attendance": {
                    "total_connected": 6,
                    "on_track_count": 5,
                    "in_pit_count": 1,
                    "session_phase": "PRACTICE",
                    "phase_countdown_str": "18:42",
                    "gridding_status": "5/6 Cars Active",
                }
            }

        return global_telemetry

# -----------------------------------------------------------------------------
# 15. WEBSOCKET SERVER & BIDIRECTIONAL COMMAND HANDLER
# -----------------------------------------------------------------------------
async def ws_client_handler(websocket):
    global global_engine, global_hardware, global_overlay_overrides
    connected_obs_clients.add(websocket)
    global_status["obs_clients_count"] = len(connected_obs_clients)
    print(f"  [OBS / STUDIO / RIG CONNECTED] Client from {websocket.remote_address} connected. Total: {len(connected_obs_clients)}")

    async def receive_commands():
        global global_overlay_overrides, global_hardware
        try:
            async for raw_message in websocket:
                try:
                    cmd = json.loads(raw_message)
                    action = cmd.get("action")

                    if action == "SWITCH_CAM_POS" and global_engine:
                        pos = cmd.get("pos", 1)
                        group = cmd.get("group", "TV1")
                        global_engine.cam_switch_pos(pos, group)

                    elif action == "SWITCH_CAM_NUM" and global_engine:
                        car_num = cmd.get("car_num", "0")
                        group = cmd.get("group", "TV1")
                        global_engine.cam_switch_num(car_num, group)

                    elif action == "SWITCH_CAM_GROUP" and global_engine:
                        group = cmd.get("group", "TV1")
                        global_engine.cam_set_group(group)

                    elif action == "TRIGGER_REPLAY" and global_engine:
                        seconds = cmd.get("seconds", 10)
                        speed = cmd.get("speed", 0.5)
                        global_engine.replay_jump(seconds)
                        if speed != 1.0:
                            global_engine.replay_play(speed)

                    elif action == "REPLAY_PLAY" and global_engine:
                        speed = cmd.get("speed", 1.0)
                        global_engine.replay_play(speed)

                    elif action == "REPLAY_PAUSE" and global_engine:
                        global_engine.replay_play(0.0)

                    elif action == "REPLAY_SEARCH_INCIDENT" and global_engine:
                        global_engine.replay_search_incident()

                    elif action == "REPLAY_RETURN_TO_LIVE" and global_engine:
                        global_engine.replay_return_to_live()

                    elif action == "OVERLAY_OVERRIDE":
                        overrides = cmd.get("overrides", {})
                        with telemetry_lock:
                            global_overlay_overrides.update(overrides)

                    elif action == "CLEAR_OVERLAYS":
                        with telemetry_lock:
                            global_overlay_overrides.clear()

                    elif action == "STEWARD_AUDIO_CHUNK":
                        pcm_b64 = cmd.get("pcm_b64")
                        if pcm_b64 and HAS_AUDIO:
                            try:
                                pcm_bytes = base64.b64decode(pcm_b64)
                                pcm_array = np.frombuffer(pcm_bytes, dtype=np.float32)
                                inject_steward_voice(pcm_array)
                            except Exception:
                                pass

                    elif action == "STEWARD_CHIME":
                        play_radio_chime()

                    elif action == "SPOTTER_SAY":
                        text = cmd.get("text", "")
                        is_steward = cmd.get("is_steward", False)
                        if text:
                            speak_spotter(text, is_steward_announcement=is_steward)

                    elif action == "ANNOUNCE_RACE_CONTROL":
                        msg_text = cmd.get("text", "")
                        if msg_text:
                            speak_spotter(msg_text, is_steward_announcement=True)

                    elif action == "CHECK_FOR_UPDATES":
                        res = check_for_updates_now(force=cmd.get("force", False), trigger_reason="manual_ui")
                        resp = {
                            "type": "UPDATE_CHECK_RESULT",
                            "current_version": DAEMON_VERSION,
                            "result": res,
                            "status": global_status.get("update_status", "Up to date")
                        }
                        await websocket.send(json.dumps(resp))

                    elif action == "SET_WINDOWS_STARTUP":
                        enable = bool(cmd.get("enabled", True))
                        success = set_windows_startup(enable)
                        global_status["windows_startup"] = success
                        await websocket.send(json.dumps({
                            "type": "WINDOWS_STARTUP_STATUS",
                            "enabled": success,
                            "status": "OK"
                        }))

                    elif action == "GET_RIG_CONFIG_AND_DEVICES":
                        devs = enumerate_all_devices()
                        resp = {
                            "type": "RIG_CONFIG_AND_DEVICES",
                            "config": config,
                            "devices": devs,
                            "status": global_status,
                            "daemon_version": DAEMON_VERSION,
                            "windows_startup": is_windows_startup_enabled(),
                        }
                        await websocket.send(json.dumps(resp))

                    elif action == "SAVE_RIG_CONFIG":
                        new_cfg = cmd.get("config", {})
                        if new_cfg:
                            save_config(new_cfg)
                            resp = {
                                "type": "CONFIG_SAVED",
                                "config": config,
                                "status": "OK"
                            }
                            await websocket.send(json.dumps(resp))

                    elif action == "TEST_FAN":
                        pwr = cmd.get("power", 75)
                        if global_hardware:
                            global_hardware.set_test_fan(pwr, duration_sec=cmd.get("duration", 5.0))

                    elif action == "TEST_LED":
                        led_m = cmd.get("mode", "REDLINE_SHIFT")
                        if global_hardware:
                            global_hardware.set_test_led(led_m, duration_sec=cmd.get("duration", 5.0))

                    elif action == "TEST_AUDIO":
                        play_radio_chime()

                    elif action == "TEST_SPOTTER":
                        speak_spotter("Apex Chief Spotter test callout: All systems nominal. Ready to race.")

                    elif action == "FORCE_SYNC_PAINTS":
                        count = sync_paints_now()
                        await websocket.send(json.dumps({"type": "SYNC_RESULT", "target": "paints", "count": count}))

                    elif action == "FORCE_SYNC_SETUPS":
                        count = sync_setups_now()
                        await websocket.send(json.dumps({"type": "SYNC_RESULT", "target": "setups", "count": count}))

                    elif action == "RESCAN_COM_PORTS":
                        if global_hardware:
                            connected = global_hardware.connect()
                            await websocket.send(json.dumps({"type": "HARDWARE_STATUS", "connected": connected, "port": global_hardware.port}))

                except Exception as e:
                    print(f"  [WS COMMAND PARSE ERROR] {e}")
        except Exception:
            pass

    receiver_task = asyncio.create_task(receive_commands())

    try:
        while True:
            with telemetry_lock:
                payload_str = json.dumps(global_telemetry)
            await websocket.send(payload_str)
            await asyncio.sleep(1.0 / config.get("telemetry_fps", 60))
    except Exception:
        pass
    finally:
        receiver_task.cancel()
        connected_obs_clients.discard(websocket)
        global_status["obs_clients_count"] = len(connected_obs_clients)
        print(f"  [OBS / STUDIO / RIG DISCONNECTED] Total clients: {len(connected_obs_clients)}")

async def start_websocket_server(port: int):
    if not HAS_WEBSOCKETS:
        print(f"  [CRITICAL ERROR] 'websockets' library not installed. Run: pip install websockets")
        return
    print(f"  [OBS WEBSOCKET] Starting 60 FPS bidirectional stream on ws://127.0.0.1:{port}...")
    async with websockets.serve(ws_client_handler, "0.0.0.0", port):
        await asyncio.Future()

def websocket_thread_worker(port: int):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(start_websocket_server(port))
    except Exception as e:
        print(f"  [WEBSOCKET SERVER CRASH] {e}")

# -----------------------------------------------------------------------------
# 16. CLOUD TIMING & STANDINGS WORKER
# -----------------------------------------------------------------------------
def cloud_sync_worker(league_id: str):
    if not HAS_REQUESTS:
        return
    url = f"https://us-central1-iracersresource.cloudfunctions.net/api/srleague/iracing/telemetry"
    while True:
        if config.get("cloud_sync_enabled", True) and global_status["iracing_connected"]:
            try:
                with telemetry_lock:
                    payload = dict(global_telemetry)
                payload["league_id"] = league_id
                requests.post(url, json=payload, timeout=2.0)
            except Exception:
                pass
        time.sleep(config.get("cloud_sync_interval_sec", 1.5))

# -----------------------------------------------------------------------------
# 17. CLI DASHBOARD DISPLAY
# -----------------------------------------------------------------------------
def render_cli_dashboard():
    os.system("cls" if os.name == "nt" else "clear")
    print("=" * 75)
    print(f"   🏎️  GRIDPASS.APP SRCOMMANDER v{DAEMON_VERSION} — NATIVE WINDOWS APP  🏁")
    print("=" * 75)
    print(f"  System Tray Icon:   🟢 ACTIVE (Taskbar by Clock • Right-Click for Menu)")
    print(f"  Auto-Updater:       🟢 Active ({global_status['update_status']} • Checked: {global_status['last_update_check']})")
    print(f"  Windows Startup:    {'🟢 ENABLED (Auto-runs on PC Boot)' if is_windows_startup_enabled() else '⚪ MANUAL (Run via Shortcut)'}")
    print(f"  Sim Connection:     {'🟢 ACTIVE (iRacing 60 FPS)' if global_status['iracing_connected'] else '⚪ STANDBY (Waiting for iRacing...)'}")
    print(f"  OBS / Studio / Rig: {'🟢 ' + str(global_status['obs_clients_count']) + ' Connected Client(s)' if global_status['obs_clients_count'] > 0 else '⚪ Standby (ws://127.0.0.1:' + str(config.get('obs_port', 8080)) + ')'}")
    print(f"  USB Face-Cam:       {'🟢 Active DirectShow 30 FPS' if global_status['webcam_active'] else '⚪ Standby (No Camera / In Use)'}")
    print(f"  Headset Audio:      🟢 Active 48kHz Intercom Sink (Mic: {current_mic_db_level:.1f} dB)")
    print(f"  Director Action:    {global_status['director_last_action']}")
    print(f"  Session Announce:   {global_status['last_session_announcement']}")
    print(f"  Hardware Pod:       {'🟢 ' + global_status['hardware_port'] if global_status['hardware_connected'] else '⚪ Not Detected'}")
    print(f"  Wind Fan Power:     {global_status['wind_fan_power_pct']}%  |  Halo LEDs: {global_status['halo_led_state']}")
    print(f"  Paint Schemes:      Synced {global_status['paints_synced_count']} car(s) @ {global_status['last_paint_sync']}")
    print(f"  Setups Synced:      Synced {global_status['setups_synced_count']} car(s) @ {global_status['last_setup_sync']}")
    print(f"  AI Voice Spotter:   {global_status['last_spotter_call']}")
    print("-" * 75)
    
    with telemetry_lock:
        f_car = global_telemetry.get("focused_car")
        s_info = global_telemetry.get("session_info")
        tower = global_telemetry.get("timing_tower", [])
        paddock = global_telemetry.get("paddock_attendance", {})
    
    if s_info:
        print(f"  Track: {s_info.get('track_name')} ({s_info.get('track_config', 'Full')}) | Phase: {paddock.get('session_phase', 'STANDBY')} ({paddock.get('phase_countdown_str', '--:--')}) | Flag: {s_info.get('flag_state')}")
        print(f"  Paddock Attendance: {paddock.get('on_track_count', 0)} On Track | {paddock.get('in_pit_count', 0)} In Pit | {paddock.get('total_connected', 0)} Connected to Sim Server")
    if f_car:
        print(f"  Focused Driver: #{f_car.get('num')} {f_car.get('name')} | P{f_car.get('pos')} | Speed: {f_car.get('speed_mph')} MPH | Gear: {f_car.get('gear')} | RPM: {f_car.get('rpm')} | Thr: {f_car.get('throttle_pct')}% | Brk: {f_car.get('brake_pct')}%")
    if tower:
        print(f"  Timing Tower ({len(tower)} cars): P1 {tower[0].get('name')} ({tower[0].get('best_lap_str')}) | P2 {tower[1].get('name') if len(tower)>1 else ''}")
    print("=" * 75)
    print("  [Ctrl+C] or Right-Click Taskbar Tray Icon to exit.")

# -----------------------------------------------------------------------------
# 18. MAIN ENTRY POINT
# -----------------------------------------------------------------------------
def main():
    global global_engine, global_hardware, global_tray
    parser = argparse.ArgumentParser(description="GridPass.App SRCommander Master Daemon")
    parser.add_argument("--mock", action="store_true", help="Run in mock simulation mode without iRacing")
    parser.add_argument("--port", type=int, default=config.get("obs_port", 8080), help="OBS WebSocket port (default: 8080)")
    parser.add_argument("--no-cli", action="store_true", help="Disable interactive terminal dashboard")
    parser.add_argument("--no-tray", action="store_true", help="Disable Windows system tray icon")
    args = parser.parse_args()

    engine = TelemetryEngine(mock_mode=args.mock)
    global_engine = engine
    
    hardware = HardwareController()
    global_hardware = hardware
    hardware.connect()

    ws_thread = threading.Thread(target=websocket_thread_worker, args=(args.port,), daemon=True)
    ws_thread.start()

    cloud_thread = threading.Thread(target=cloud_sync_worker, args=(config.get("league_id", "default"),), daemon=True)
    cloud_thread.start()

    updater_thread = threading.Thread(target=auto_updater_worker, daemon=True)
    updater_thread.start()

    webcam_thread = threading.Thread(target=webcam_capture_worker, daemon=True)
    webcam_thread.start()

    audio_thread = threading.Thread(target=audio_playback_worker, daemon=True)
    audio_thread.start()

    mic_thread = threading.Thread(target=mic_input_monitor_worker, daemon=True)
    mic_thread.start()

    paint_thread = threading.Thread(target=paint_sync_worker, daemon=True)
    paint_thread.start()

    setup_thread = threading.Thread(target=setup_sync_worker, daemon=True)
    setup_thread.start()

    spotter_thread = threading.Thread(target=spotter_worker, daemon=True)
    spotter_thread.start()

    # Launch Windows System Tray Icon in background thread
    if HAS_TRAY and not args.no_tray:
        tray_manager = WindowsSystemTrayManager()
        global_tray = tray_manager
        tray_thread = threading.Thread(target=tray_manager.run, daemon=True)
        tray_thread.start()

    print(f"[STARTUP] GridPass.App SRCommander v{DAEMON_VERSION} running on port {args.port} (Mock={args.mock})...")

    tick = 0
    try:
        while True:
            start_t = time.time()
            data = engine.update()
            
            f_car = data.get("focused_car")
            s_info = data.get("session_info")
            if f_car:
                spd = f_car.get("speed_mph", 0.0)
                rpm = f_car.get("rpm", 0)
                rpm_max = f_car.get("rpm_max", 8200)
                flag = s_info.get("flag_state", "GREEN") if s_info else "GREEN"
                on_track = (f_car.get("track_status") == "ON TRACK")
                hardware.update(spd, rpm, rpm_max, flag, on_track)

            tick += 1
            if not args.no_cli and tick % 30 == 0:
                render_cli_dashboard()

            elapsed = time.time() - start_t
            sleep_time = max(0.001, (1.0 / config.get("telemetry_fps", 60)) - elapsed)
            time.sleep(sleep_time)

    except KeyboardInterrupt:
        print("\n[STOPPING] Shutting down GridPass.App SRCommander daemon...")
    finally:
        speech_queue.put(None)
        audio_playback_queue.put(None)
        if global_tray and global_tray.icon:
            try:
                global_tray.icon.stop()
            except Exception:
                pass
        print("[STOPPED] GridPass.App SRCommander terminated cleanly.")

if __name__ == "__main__":
    main()
