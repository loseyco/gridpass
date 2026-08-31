#!/usr/bin/env python3
# =============================================================================
# GRIDPASS SRCOMMANDER // NATIVE WINDOWS DESKTOP APPLICATION
# =============================================================================
# Purpose: Standalone native Windows desktop application window using Edge
#          WebView2 Evergreen Runtime.
# Usage:
#   python scripts/gridpass_desktop_app.py         (Dev mode -> localhost:3000)
#   python scripts/gridpass_desktop_app.py --live  (Live mode -> gridpass.app)
# =============================================================================

import sys
import os
import argparse
import subprocess
import threading
import time
import urllib.request

try:
    import webview
except ImportError:
    print("[ERROR] 'pywebview' is required for the native Windows app.")
    print("        Run: pip install pywebview")
    sys.exit(1)

# Default URLs
DEV_URL = "http://localhost:3000/srcommander/comms"
LIVE_URL = "https://gridpass.app/srcommander/comms"

def check_server_available(url, timeout=1.5):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'GridPassDesktopApp/4.3'})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.status == 200
    except Exception:
        return False

class DesktopAppAPI:
    def __init__(self, window):
        self._window = window

    def minimize_window(self):
        if self._window:
            self._window.minimize()

    def maximize_window(self):
        if self._window:
            self._window.toggle_fullscreen()

    def close_window(self):
        if self._window:
            self._window.destroy()

def main():
    parser = argparse.ArgumentParser(description="GridPass SRCommander Native Desktop App")
    parser.add_argument("--live", action="store_true", help="Launch against live https://gridpass.app")
    parser.add_argument("--dev", action="store_true", help="Launch against local dev server http://localhost:3000")
    parser.add_argument("--hud", action="store_true", help="Launch directly in transparent In-Game HUD mode")
    args = parser.parse_args()

    # Determine Target URL
    if args.live:
        target_url = LIVE_URL
        print("  [GRIDPASS APP] Mode: 🌐 LIVE PRODUCTION (gridpass.app)")
    elif args.dev:
        target_url = DEV_URL
        print("  [GRIDPASS APP] Mode: 💻 LOCAL DEVELOPMENT (localhost:3000)")
    else:
        if check_server_available("http://localhost:3000"):
            target_url = DEV_URL
            print("  [GRIDPASS APP] Detected local dev server -> http://localhost:3000")
        else:
            target_url = LIVE_URL
            print("  [GRIDPASS APP] Local dev server offline -> Connecting to https://gridpass.app")

    if args.hud:
        target_url = target_url.replace("/srcommander/comms", "/srcommander/overlay")

    print(f"  [GRIDPASS APP] Launching Native Windows Window -> {target_url}")

    api = DesktopAppAPI(None)
    window = webview.create_window(
        title="GridPass SRCommander — Native Desktop Command Center",
        url=target_url,
        js_api=api,
        width=1380,
        height=900,
        min_size=(1024, 700),
        frameless=False,
        easy_drag=True,
        on_top=args.hud,
        transparent=args.hud,
        background_color='#FFFFFF'
    )
    api._window = window

    webview.start(gui='edgechromium', debug=False)

if __name__ == "__main__":
    main()
