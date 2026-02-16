import irsdk
import inspect

def print_members(obj, name):
    print(f"\n--- {name} ---")
    for n, v in inspect.getmembers(obj):
        if not n.startswith("__"):
            print(f"{n}: {v}")

if __name__ == "__main__":
    print_members(irsdk.BroadcastMsg, "irsdk.BroadcastMsg")
    
    ir = irsdk.IRSDK()
    print_members(ir, "irsdk.IRSDK()")
