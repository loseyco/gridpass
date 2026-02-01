import time
import json
import sys
import threading
import irsdk

def input_loop(ir):
    """
    Reads commands from stdin (JSON lines) and executes them.
    Non-blocking to the main telemetry loop.
    """
    for line in sys.stdin:
        try:
            if not line.strip(): continue
            msg = json.loads(line)
            
            cmd = msg.get('command')
            
            # 1. Broadcast Message (Generic)
            # { "command": "broadcast", "msg": 0, "v1": 0, "v2": 0, "v3": 0 }
            if cmd == 'broadcast':
                msg_id = msg.get('msg', 0)
                v1 = msg.get('v1', 0)
                v2 = msg.get('v2', 0)
                v3 = msg.get('v3', 0)
                ir.broadcast_msg(msg_id, v1, v2, v3)
                
            # 2. Pit Commands (Macros)
            # { "command": "pit", "item": "fuel", "value": 10 }
            elif cmd == 'pit':
                # Implement specific pit commands if needed using broadcast_msg
                # irsdk.BroadcastPitCommand?
                pass
                
        except Exception as e:
            # log to stderr to avoid polluting json stdout
            sys.stderr.write(f"Cmd Error: {e}\n")
            sys.stderr.flush()

def main():
    # Initialize iRacing SDK
    ir = irsdk.IRSDK()
    print(json.dumps({"status": "initializing", "message": "Python Bridge Starting..."}))
    sys.stdout.flush()

    # Start Input Thread
    input_thread = threading.Thread(target=input_loop, args=(ir,), daemon=True)
    input_thread.start()

    last_connected = False
    last_session_update = -1
    
    session_data_cache = {}

    while True:
        try:
            # Check connection
            if not ir.is_initialized or not ir.is_connected:
                ir.startup()
                
            is_connected = ir.is_initialized and ir.is_connected
            
            if is_connected:
                # Freeze buffer
                ir.freeze_var_buffer_latest()
                
                # --- TELEMETRY EXTRACTION ---
                
                # 1. Basic Physics
                rpm = ir['RPM'] if 'RPM' in ir else 0
                speed = (ir['Speed'] * 3.6) if 'Speed' in ir else 0 # km/h
                gear = ir['Gear'] if 'Gear' in ir else 0
                
                # 2. Session Time / Flags
                session_time = ir['SessionTime'] if 'SessionTime' in ir else 0
                flags = ir['SessionFlags'] if 'SessionFlags' in ir else 0
                
                # 3. Car State
                on_track = bool(ir['IsOnTrack']) if 'IsOnTrack' in ir else False
                in_pit = bool(ir['OnPitRoad']) if 'OnPitRoad' in ir else False
                
                # 4. Session Info (Metadata) - Optimized
                current_update = ir['SessionInfoUpdate'] if 'SessionInfoUpdate' in ir else -1
                
                if current_update > last_session_update:
                    last_session_update = current_update
                    # Parse YAML only when changed
                    try:
                        weekend = ir['WeekendInfo'] or {}
                        driver_info = ir['DriverInfo'] or {}
                        session_info = ir['SessionInfo'] or {}
                        
                        # Extract Drivers
                        drivers = []
                        raw_drivers = driver_info.get('Drivers', [])
                        # My Car Idx
                        my_idx = driver_info.get('DriverCarIdx', 0)
                        
                        # Get User Data
                        me = next((d for d in raw_drivers if d.get('CarIdx') == my_idx), {})
                        
                        session_data_cache = {
                            "track": weekend.get('TrackDisplayName', 'Unknown'),
                            "car": me.get('CarScreenName', 'Unknown'),
                            "driver": me.get('UserName', 'Unknown'),
                            "sessionType": "Unknown" # Parse specific session later
                        }
                    except Exception as e:
                       sys.stderr.write(f"Parse Error: {e}\n")

                # Payload
                payload = {
                    "connected": True,
                    "timestamp": time.time(),
                    "rpm": rpm,
                    "speed": speed,
                    "gear": gear,
                    "sessionTime": session_time,
                    "flags": flags,
                    "onTrack": on_track,
                    "inPit": in_pit,
                    # Spread cached session info
                    **session_data_cache
                }
                
                print(json.dumps(payload))
                sys.stdout.flush()
                last_connected = True
                
            else:
                # Not connected heartbeat (throttled)
                # Send "connected": false every 1s so UI knows bridge is alive
                if not last_connected or (time.time() - last_session_update > 1.0):
                     print(json.dumps({"connected": False, "message": "Waiting for iRacing..."}))
                     sys.stdout.flush()
                     last_session_update = time.time()
                     last_connected = False
                
                # Try to connect every second if failed
                time.sleep(1)
                
        except Exception as e:
            # Log error as JSON to avoid breaking parser
            error_msg = {"error": str(e)}
            print(json.dumps(error_msg))
            sys.stdout.flush()
            
        time.sleep(1/60)

if __name__ == "__main__":
    main()
