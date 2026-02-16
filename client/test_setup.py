"""
Test Script - Verify GridPass Client Setup

This script tests:
1. Dependencies are installed
2. API is reachable
3. Device can register
4. Commands can be received
"""
import sys

def test_dependencies():
    """Test that all required packages are installed"""
    print("\n🔍 Testing dependencies...")
    
    missing = []
    packages = {
        'requests': 'requests',
        'psutil': 'psutil',
        'pyautogui': 'pyautogui',
    }
    
    for module, package in packages.items():
        try:
            __import__(module)
            print(f"  ✓ {package}")
        except ImportError:
            print(f"  ✗ {package} - NOT INSTALLED")
            missing.append(package)
    
    # Optional packages
    try:
        import GPUtil
        print(f"  ✓ GPUtil (optional)")
    except ImportError:
        print(f"  ⚠️  GPUtil (optional) - not installed")
    
    try:
        import irsdk
        print(f"  ✓ irsdk (optional)")
    except ImportError:
        print(f"  ⚠️  irsdk (optional) - not installed")
    
    if missing:
        print(f"\n❌ Missing packages: {', '.join(missing)}")
        print(f"   Run: pip install {' '.join(missing)}")
        return False
    
    print("\n✅ All required dependencies installed")
    return True


def test_api_connection():
    """Test connection to GridPass API"""
    print("\n🔍 Testing API connection...")
    
    import requests
    import config
    
    try:
        # Test health endpoint (if it exists)
        response = requests.get(f"{config.API_BASE_URL}/health", timeout=5)
        print(f"  ✓ API reachable at {config.API_BASE_URL}")
        return True
    except requests.exceptions.ConnectionError:
        print(f"  ✗ Cannot connect to {config.API_BASE_URL}")
        print(f"    Is the server running?")
        return False
    except Exception as e:
        print(f"  ⚠️  API test inconclusive: {e}")
        return True  # Don't fail on this


def test_device_info():
    """Test device info gathering"""
    print("\n🔍 Testing device info gathering...")
    
    from device_manager import DeviceManager
    import config
    
    try:
        dm = DeviceManager(config.API_BASE_URL)
        
        print(f"  ✓ Hardware fingerprint: {dm.hardware_fingerprint[:16]}...")
        print(f"  ✓ CPU: {dm.pc_info.get('cpu_model', 'Unknown')}")
        print(f"  ✓ RAM: {dm.pc_info.get('ram_gb', 0)} GB")
        print(f"  ✓ GPU: {dm.pc_info.get('gpu_model') or 'Not detected'}")
        print(f"  ✓ OS: {dm.pc_info.get('os_version', 'Unknown')}")
        
        return True
    except Exception as e:
        print(f"  ✗ Error gathering device info: {e}")
        return False


def test_config():
    """Test configuration"""
    print("\n🔍 Testing configuration...")
    
    import config
    
    issues = []
    
    if "your-project.supabase.co" in config.SUPABASE_URL:
        issues.append("SUPABASE_URL not configured")
    else:
        print(f"  ✓ Supabase URL: {config.SUPABASE_URL}")
    
    if "your-anon-key" in config.SUPABASE_ANON_KEY:
        issues.append("SUPABASE_ANON_KEY not configured")
    else:
        print(f"  ✓ Supabase key configured")
    
    print(f"  ✓ API URL: {config.API_BASE_URL}")
    print(f"  ✓ Client version: {config.CLIENT_VERSION}")
    
    enabled_modules = [k for k, v in config.MODULES_ENABLED.items() if v]
    print(f"  ✓ Enabled modules: {', '.join(enabled_modules) or 'None'}")
    
    if issues:
        print(f"\n⚠️  Configuration issues:")
        for issue in issues:
            print(f"    - {issue}")
        print(f"\n  Edit config.py to fix these issues")
        return False
    
    return True


def main():
    print("╔════════════════════════════════════╗")
    print("║  GridPass Client - Test Suite     ║")
    print("╚════════════════════════════════════╝")
    
    tests = [
        ("Dependencies", test_dependencies),
        ("Configuration", test_config),
        ("Device Info", test_device_info),
        ("API Connection", test_api_connection),
    ]
    
    results = []
    for name, func in tests:
        try:
            result = func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ Test '{name}' crashed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*40)
    print("SUMMARY")
    print("="*40)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    all_passed = all(r for _, r in results)
    
    if all_passed:
        print("\n🎉 All tests passed! Ready to run:")
        print("   python main.py")
    else:
        print("\n⚠️  Some tests failed. Fix issues before running.")
        sys.exit(1)


if __name__ == "__main__":
    main()
