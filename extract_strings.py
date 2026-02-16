import sys
import re

def strings(filename, min=3):
    with open(filename, "rb") as f:
        data = f.read()
    
    print(f"File size: {len(data)} bytes")
    
    # regex for printable chars
    # standard ASCII printable: 32-126
    # We will try to decode assuming ascii/latin1
    # But binary might interrupt.
    
    count = 0
    # Simple loop
    current_str = []
    for byte in data:
        if 32 <= byte <= 126:
            current_str.append(chr(byte))
        else:
            if len(current_str) >= min:
                s = "".join(current_str)
                print(s)
                count += 1
            current_str = []
    
    if len(current_str) >= min:
        print("".join(current_str))
        
    print(f"Found {count} strings")

if __name__ == "__main__":
    path = r"C:\Users\pjlos\OneDrive\Documents\iRacing\controls.cfg"
    try:
        strings(path)
    except Exception as e:
        print(f"Error: {e}")
    
