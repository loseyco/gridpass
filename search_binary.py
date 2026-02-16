import sys

def search(filename, terms):
    with open(filename, "rb") as f:
        data = f.read()
    
    encodings = ['ascii', 'utf-16le']
    
    for term in terms:
        for enc in encodings:
            try:
                term_bytes = term.encode(enc)
            except:
                continue
                
            start = 0
            count = 0
            print(f"--- Searching for '{term}' ({enc}) ---")
            while True:
                idx = data.find(term_bytes, start)
                if idx == -1:
                    break
                
                # Print context (raw bytes + decoded if possible)
                context_start = max(0, idx - 20)
                context_end = min(len(data), idx + len(term_bytes) + 20)
                snippet = data[context_start:context_end]
                print(f"Match at {idx}: {snippet}")
                
                start = idx + 1
                count += 1
                if count > 5: # Limit output per term
                    print("... (more matches)")
                    break

if __name__ == "__main__":
    terms = ["Reset", "Tow", "Car", "Vehicle", "Driver"]
    search(r"C:\Users\pjlos\OneDrive\Documents\iRacing\controls.cfg", terms)
