"""
Test script for iRacing Telemetry
Run this while iRacing is running to verify data reading.
"""
import time
import os
import sys

# Add current directory to path to find modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import irsdk
    print("✓ irsdk library found")
except ImportError:
    print("✗ irsdk library NOT found. Please run: pip install pyirsdk")
    sys.exit(1)

def main():
    print("Initializing IRSDK...")
    ir = irsdk.IRSDK()
    
    if not ir.startup():
        print("Waiting for iRacing to start...")
        
    try:
        while True:
            connected = ir.is_connected
            
            if connected:
                # Freeze buffer
                ir.freeze_var_buffer_latest()
                
                # Read data
                rpm = ir['RPM']
                speed = ir['Speed'] * 2.23694 # m/s to mph
                gear = ir['Gear']
                
                # Print
                sys.stdout.write(f"\r🏎️  RPM: {rpm:.0f} | Speed: {speed:.0f} MPH | Gear: {gear} | Connected: YES   ")
                sys.stdout.flush()
            else:
                sys.stdout.write(f"\r⏳ Waiting for iRacing... | Connected: NO                            ")
                sys.stdout.flush()
                # Try to startup again
                ir.startup()
            
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print("\nStopped.")

if __name__ == "__main__":
    main()
