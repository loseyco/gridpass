"""
Simple test script to verify GridPass client setup without requiring iRacing SDK
"""
import sys
import requests
import psutil
import platform

def test_dependencies():
    """Test that all dependencies are importable"""
    print("Testing GridPass Client Dependencies...\n")
    
    # Test imports
    deps = {
        'requests': requests,
        'psutil': psutil,
    }
    
    try:
        import GPUtil
        deps['GPUtil'] = GPUtil
    except:
        print("⚠️  GPUtil not available (GPU monitoring disabled)")
    
    try:
        import pynput
        deps['pynput'] = pynput
    except:
        print("⚠️  pynput not available (keyboard control disabled)")
    
    try:
        import pyautogui
        deps['pyautogui'] = pyautogui
    except:
        print("⚠️  pyautogui not available (GUI automation disabled)")
    
    try:
        import win32api
        deps['pywin32'] = win32api
    except:
        print("⚠️  pywin32 not available (Windows API disabled)")
    
    print(f"✅ Core dependencies: {len(deps)} packages loaded\n")
    
    # Test system info gathering
    print("System Information:")
    print(f"  Python: {platform.python_version()}")
    print(f"  OS: {platform.system()} {platform.release()}")
    print(f"  CPU: {platform.processor()}")
    print(f"  RAM: {psutil.virtual_memory().total / (1024**3):.1f} GB")
    print()
    
    return True

def test_api_connectivity():
    """Test connection to GridPass API"""
    print("Testing API Connectivity...")
    
    # Test localhost server
    try:
        response = requests.get('http://localhost:3000/', timeout=5)
        if response.status_code == 200:
            print("✅ Can reach local GridPass server (http://localhost:3000)")
        else:
            print(f"⚠️  Server responded with status {response.status_code}")
    except Exception as e:
        print(f"❌ Cannot reach local server: {e}")
    
    print()

if __name__ == '__main__':
    print("=" * 60)
    print("GridPass Client - Setup Verification")
    print("=" * 60)
    print()
    
    try:
        if test_dependencies():
            test_api_connectivity()
            print("=" * 60)
            print("✅ Setup verification complete!")
            print("=" * 60)
            print()
            print("Ready to run: python main.py")
            print()
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        sys.exit(1)
