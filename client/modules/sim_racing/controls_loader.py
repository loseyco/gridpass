import os
import struct
import re
from pathlib import Path
from typing import Dict, Tuple, Optional, List

# Action definitions
ACTIONS = {
    "reset_car": {"cfg_names": ("RunActiveReset", "Reset")},
    "enter_car": {"cfg_names": ("EnterCar", "Enter")},
    "exit_car": {"cfg_names": ("ExitCar", "Exit")},
    "tow_car":   {"cfg_names": ("TowCar", "Tow")}
}

# VK mappings to pyautogui keys
VK_TO_PYAUTOGUI = {
    0x0D: "enter",
    0x10: "shift",
    0x11: "ctrl", 
    0x12: "alt",
    0x20: "space",
    0x1B: "esc",
}
# Add F-keys
for i in range(1, 13):
    VK_TO_PYAUTOGUI[0x6F + i] = f"f{i}"
# Add numbers and letters
for i in range(48, 58): # 0-9
    VK_TO_PYAUTOGUI[i] = chr(i)
for i in range(65, 91): # A-Z
    VK_TO_PYAUTOGUI[i] = chr(i).lower()

class ControlsLoader:
    def __init__(self):
        self._iracing_dirs = self._find_iracing_dirs()
        self.bindings = {}
        self._last_mtime = 0.0
        
    def _find_iracing_dirs(self) -> List[Path]:
        profile = Path(os.environ.get("USERPROFILE", "")).expanduser()
        candidates = [
            profile / "Documents" / "iRacing",
            profile / "OneDrive" / "Documents" / "iRacing",
        ]
        return [p for p in candidates if p.exists()]
        
    def _find_controls_cfg(self) -> Optional[Path]:
        for d in self._iracing_dirs:
            cfg = d / "controls.cfg"
            if cfg.exists():
                return cfg
        return None
        
    def load_bindings(self):
        cfg_path = self._find_controls_cfg()
        if not cfg_path:
            return
            
        try:
            with open(cfg_path, "rb") as f:
                data = f.read()
            
            for action, defn in ACTIONS.items():
                combo = self._extract_binding(data, defn["cfg_names"])
                if combo:
                    self.bindings[action] = combo
            
            # Fallback for enter_car -> reset_car logic (legacy behavior)
            if "enter_car" not in self.bindings and "reset_car" in self.bindings:
                self.bindings["enter_car"] = self.bindings["reset_car"]
                
        except Exception:
            pass

    def _extract_binding(self, data: bytes, names: Tuple[str, ...]) -> Optional[Dict]:
        for name in names:
            pattern = name.encode("ascii") + b"\x00"
            for match in re.finditer(pattern, data):
                start = match.end()
                if start + 16 > len(data):
                    continue
                try:
                    vals = struct.unpack_from("<4I", data, start)
                    # vals: (joystick_dev, joystick_btn_or_something, control_type, value)
                    b_type = vals[2]
                    value = vals[3]
                    
                    if b_type == 4 and value:
                        return self._decode_keyboard_value(value)
                except:
                    continue
        return None

    def _decode_keyboard_value(self, value: int) -> Dict:
        keys = []
        if value & 0x00010000: keys.append("shift")
        if value & 0x00020000: keys.append("ctrl")
        if value & 0x00040000: keys.append("alt")
        
        vk = value & 0xFF
        key_name = VK_TO_PYAUTOGUI.get(vk, str(vk))
        keys.append(key_name)
        return {"keys": keys}


    def get_action_keys(self, action: str) -> List[str]:
        # Check for update
        cfg_path = self._find_controls_cfg()
        if cfg_path:
            try:
                mtime = cfg_path.stat().st_mtime
                if mtime != self._last_mtime:
                    self._last_mtime = mtime
                    self.load_bindings()
            except:
                pass
        
        if not self.bindings:
            self.load_bindings()
        
        b = self.bindings.get(action)
        return b["keys"] if b else []
