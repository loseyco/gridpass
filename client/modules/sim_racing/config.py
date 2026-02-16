"""
Sim Racing Module Configuration
"""

# iRacing Connection
IRACING_CHECK_INTERVAL = 1  # How often to check if iRacing is running (seconds)

# Keybindings for remote commands (customize these to match your iRacing settings)
KEYBINDS = {
    "reset_car": "r",           # Reset car to pits
    "ignition": "i",            # Ignition on/off
    "pit_limiter": "l",         # Pit limiter toggle
    # Add more as needed
}

# Telemetry
TELEMETRY_CAPTURE_INTERVAL = 1  # How often to capture telemetry (seconds)
UPLOAD_LAPS = True  # Upload lap times to GridPass
