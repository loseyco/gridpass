# c:\_Projects\Gridpass-v4\business_launch\test_ux_and_crypto.py
import math
import hashlib
import time
import json
import random

# =====================================================================
# 1. AMBIENT GLARE & CONTRAST SIMULATOR
# =====================================================================

def calculate_luminance(hex_color):
    """Calculates relative luminance of a color based on sRGB formula."""
    hex_color = hex_color.lstrip('#')
    r, g, b = [int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    
    # Apply gamma correction
    def adjust(val):
        return val / 12.92 if val <= 0.03928 else ((val + 0.055) / 1.055) ** 2.4
        
    R = adjust(r)
    G = adjust(g)
    B = adjust(b)
    
    return 0.2126 * R + 0.7152 * G + 0.0722 * B

def calculate_effective_contrast(bg_hex, fg_hex, screen_nits, ambient_lux, reflection_coeff=0.04):
    """
    Calculates contrast ratio under ambient glare.
    Formula:
      L_bg_eff = L_bg * screen_nits + L_glare
      L_fg_eff = L_fg * screen_nits + L_glare
      L_glare = (ambient_lux / pi) * reflection_coeff
      Contrast = (L_brightest + 0.05) / (L_darkest + 0.05)
    """
    l_bg = calculate_luminance(bg_hex)
    l_fg = calculate_luminance(fg_hex)
    
    # Calculate glare luminance in nits
    l_glare = (ambient_lux / math.pi) * reflection_coeff
    
    # Effective luminances
    l_bg_eff = l_bg * screen_nits + l_glare
    l_fg_eff = l_fg * screen_nits + l_glare
    
    darkest = min(l_bg_eff, l_fg_eff)
    brightest = max(l_bg_eff, l_fg_eff)
    
    # WCAG Contrast Formula
    contrast = (brightest + 0.05) / (darkest + 0.05)
    return contrast

def run_glare_simulation():
    """Runs a series of glare simulations under various environments."""
    scenarios = [
        # (Name, Screen Nits, Ambient Lux, Reflection Coeff)
        ("Paddock Gate (Noon Direct Sunlight)", 600, 100000, 0.045),
        ("Paddock Gate (Overcast Day)", 600, 20000, 0.040),
        ("Offroad Trail (Indirect Sunlight)", 450, 40000, 0.050),
        ("Paddock Gate (Premium iPhone 2000 Nits Outdoor peak)", 2000, 100000, 0.040),
    ]
    
    # Dark Theme colors
    dark_bg = "#060608"
    dark_fg = "#f4f4f7"
    
    # Solar Light Theme colors
    solar_bg = "#ffffff"
    solar_fg = "#000000"
    
    results = []
    for name, nits, lux, ref in scenarios:
        dark_contrast = calculate_effective_contrast(dark_bg, dark_fg, nits, lux, ref)
        solar_contrast = calculate_effective_contrast(solar_bg, solar_fg, nits, lux, ref)
        
        # Calculate theoretical zero-glare contrast for comparison
        dark_zero = calculate_effective_contrast(dark_bg, dark_fg, nits, 0, ref)
        solar_zero = calculate_effective_contrast(solar_bg, solar_fg, nits, 0, ref)
        
        results.append({
            "scenario": name,
            "nits": nits,
            "lux": lux,
            "dark_zero": dark_zero,
            "dark_contrast": dark_contrast,
            "solar_zero": solar_zero,
            "solar_contrast": solar_contrast,
        })
    return results

# =====================================================================
# 2. FITTS'S LAW TOUCH TARGET & VIBRATION SIMULATOR
# =====================================================================

def simulate_touch_accuracy(target_height_px, spacing_px, vibration_amplitude_px, num_taps=10000):
    """
    Simulates touch attempts centered on a button in a high-vibration environment.
    We model the actual touch coordinates as a bivariate normal distribution
    centered at (0,0) with standard deviation = vibration_amplitude_px.
    
    A touch is:
      - 'HIT' if it falls within target_height_px / 2 from center.
      - 'MISS' if it falls outside the target.
      - 'ADJACENT' if it falls within the adjacent target area (centered target_height_px + spacing_px away).
    """
    hits = 0
    misses = 0
    adjacent_hits = 0
    
    target_half = target_height_px / 2.0
    adjacent_center = target_height_px + spacing_px
    
    for _ in range(num_taps):
        # Generate random touch offsets using standard gaussian box-muller transform
        u1 = random.random()
        u2 = random.random()
        while u1 == 0: u1 = random.random() # avoid log(0)
        
        # Gaussian distribution for touch offset along vertical axis (Y-axis is critical for stacked lists)
        y_offset = vibration_amplitude_px * math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
        
        # Check target boundaries
        if -target_half <= y_offset <= target_half:
            hits += 1
        elif (adjacent_center - target_half) <= abs(y_offset) <= (adjacent_center + target_half):
            adjacent_hits += 1
        else:
            misses += 1
            
    return {
        "target_size": target_height_px,
        "vibration": vibration_amplitude_px,
        "hit_rate": hits / num_taps,
        "miss_rate": misses / num_taps,
        "adjacent_rate": adjacent_hits / num_taps
    }

def run_vibration_simulation():
    """Runs touch target validations for different heights and vibrations."""
    vibration_scenarios = [
        ("Stationary (Driver seated, stopped vehicle)", 4.0),
        ("Engine Idling (Driver holding phone, diesel rig)", 8.0),
        ("Bumpy Gate Lane (Towing rig crawling on gravel/dirt)", 16.0),
    ]
    
    sizes = [32, 48, 54, 72]
    results = {}
    
    for name, std_dev in vibration_scenarios:
        scenario_results = []
        for s in sizes:
            sim = simulate_touch_accuracy(s, 12, std_dev)
            scenario_results.append(sim)
        results[name] = scenario_results
        
    return results

# =====================================================================
# 3. SMS OTP BYPASS & "SPECTATOR BYPASS GUARD" HOLE VALIDATOR
# =====================================================================

class GridpassFunnelSimulator:
    def __init__(self):
        # Database mock
        self.users = {
            "user_driver_1": {"id": "user_driver_1", "name": "John Doe", "phone": "+15550192", "type": "driver", "waiver_signed": False},
            "user_spec_1": {"id": "user_spec_1", "name": "Jane Spectator", "phone": "+15559821", "type": "spectator", "waiver_signed": False}
        }
        self.registrations = {
            "reg_driver_1": {
                "id": "reg_driver_1", "user_id": "user_driver_1", "event_id": "sonoma-hpde-2026",
                "tow_vehicle_type": "pickup", "trailer_type": "flatbed", "tow_vehicle_plate": "8XYZ99",
                "waiver_signed": False, "check_in_status": "pre_registered", "run_group": "intermediate"
            }
        }
        
    def resolve_tag(self, tag_id):
        # Returns registration context if mapped
        if tag_id == "TAG-DRIVER-1":
            return {
                "tagId": tag_id,
                "tagType": "venue_gate",
                "status": "active",
                "registrationContext": {
                    "isRegistered": True,
                    "waiverStatus": "MISSING",
                    "techStatus": "PENDING",
                    "checkInStatus": "pre_registered"
                }
            }
        return {"tagId": tag_id, "tagType": "unclaimed", "status": "unclaimed"}

    def simulate_funnel(self, choice, is_otp_working, user_selected_type=None):
        """
        Simulates user progression through the ingress funnel.
        Parameters:
          choice: 'SMS_OTP' or 'BYPASS_LINK'
          is_otp_working: Boolean state representing carrier cellular signal
          user_selected_type: 'driver' or 'spectator' (if bypass is used)
        """
        # User lands on the welcome screen
        tag_resolved = self.resolve_tag("TAG-DRIVER-1")
        
        # Step B: Welcome screen choices
        if choice == "SMS_OTP":
            if not is_otp_working:
                return {
                    "success": False,
                    "state": "State C: OTP Verification",
                    "error": "OTP_TIMEOUT",
                    "message": "SMS OTP code delayed due to cellular dead zone. User stranded at gate."
                }
            else:
                # OTP works, user signs waiver
                user = self.users["user_driver_1"]
                reg = self.registrations["reg_driver_1"]
                reg["waiver_signed"] = True
                reg["check_in_status"] = "checked_in"
                return {
                    "success": True,
                    "state": "State F: Gate Clearance",
                    "user_authenticated": user["id"],
                    "waiver_signed": reg["waiver_signed"],
                    "check_in_status": reg["check_in_status"],
                    "run_group": reg["run_group"],
                    "tow_plate_declared": reg["tow_vehicle_plate"]
                }
                
        elif choice == "BYPASS_LINK":
            # OTP is delayed, user clicks the bypass link.
            # "Spectator Bypass Guard: Tie bypass check-ins to strict user-type checks,
            # blocking active drivers/rigs to prevent waiver evasion."
            
            # Since the user bypassed OTP, they are ANONYMOUS to the system (no phone verification).
            # The page asks: "Are you a spectator or a driver?"
            # Or the user is prompted to select their role.
            
            if user_selected_type == "driver":
                # Guard blocks active drivers/rigs who try to check in as drivers without OTP
                return {
                    "success": False,
                    "state": "Bypass Blocked",
                    "error": "DRIVER_BYPASS_FORBIDDEN",
                    "message": "Bypass Guard Blocked active driver from completing check-in without OTP. Driver stranded."
                }
            elif user_selected_type == "spectator":
                # Malicious active driver self-attests as "spectator" to bypass the OTP roadblock
                # Because the system is offline or they are anonymous, the system generates a spectator pass.
                spectator_pass_id = "SPEC-BYPASS-" + str(random.randint(1000, 9999))
                
                # The user gets checked in as an anonymous spectator
                # Loophole: They physically drive their truck and trailer into the paddock anyway!
                return {
                    "success": True,
                    "state": "State F: Gate Clearance (Spectator Pass)",
                    "user_authenticated": "anonymous",
                    "waiver_signed": False,  # Spectator didn't sign the complex driver liability waiver!
                    "check_in_status": "checked_in",
                    "run_group": "spectator", # Mapped as spectator, but they are physically driving!
                    "loophole_exploited": True,
                    "message": "CRITICAL EXPLOIT: Active driver bypassed SMS OTP by self-declaring as spectator. Entered paddock without signing driver waiver!"
                }
                
        return {"success": False, "state": "Unknown"}

# =====================================================================
# 4. OFFLINE CRYPTO & DATA DENSITY CALCULATOR
# =====================================================================

def simulate_crypto_and_density():
    """
    Simulates signing a registration pass and calculates the resulting QR code
    data size, comparing minimal vs full payload sizes and signature verification.
    """
    # Simulate a lightweight asymmetric key signing using HMAC/SHA256 
    # to avoid cryptography dependency, mimicking Ed25519 signature outputs.
    # Ed25519 signatures are exactly 64 bytes (128 hex chars or 88 base64 chars).
    
    private_key = b"gridpass_secret_private_key_at_edge_signing_system_2026"
    
    minimal_payload = {
        "reg": "rg_dr_1",
        "evt": "sn_2026",
        "wvr": 1
    }
    
    full_payload = {
        "reg": "registrations/reg_driver_1_heavy_towing_2026",
        "evt": "events/sonoma-hpde-may-2026-saturday-group-b",
        "usr": "users/user_driver_1_john_doe_pro_racer",
        "veh": "vehicles/vehicle_ford_f250_super_duty_2024",
        "wvr": True,
        "sig_hash": "sha256:d8a2584be10a6424c9e4d5611545d9e7c2a7e7df4cb1662df94f11545d9e7c23",
        "tow_veh": "ford-f250",
        "tow_plt": "CA-8XYZ99-TRAILER-99211",
        "passengers": ["user_passenger_1", "user_passenger_2"],
        "exp": int(time.time() + 86400)
    }
    
    def sign_payload(payload):
        serialized = json.dumps(payload, separators=(',', ':'))
        h = hashlib.sha256()
        h.update(private_key)
        h.update(serialized.encode('utf-8'))
        signature_bytes = h.digest() # 32 bytes
        # Double size to mimic Ed25519 64-byte signature
        mock_ed25519_sig = (signature_bytes + signature_bytes).hex() # 64 bytes = 128 characters
        
        # Format the URL payload embedded in QR
        qr_string = f"https://gridpass.app/offline-pass?data={serialized}&sig={mock_ed25519_sig}"
        return qr_string, len(qr_string)
    
    min_url, min_len = sign_payload(minimal_payload)
    full_url, full_len = sign_payload(full_payload)
    
    # Calculate QR Code Version and readability limits
    # QR Version 40 handles large data, but for fast camera scanning under glare,
    # we want to stay under 150 characters (Version 7 or less) for rapid decoding.
    
    def get_qr_recommendation(length):
        if length <= 70:
            return "Excellent (Instant scan <0.5s under extreme glare)"
        elif length <= 150:
            return "Good (Fast scan <1.0s under moderate glare)"
        elif length <= 300:
            return "Moderate (Slower scan, susceptible to outdoor reflections)"
        else:
            return "Poor (Severe scanning delays, frequently fails under outdoor glare/dirty screens)"
            
    return {
        "min_payload_chars": min_len,
        "min_recommendation": get_qr_recommendation(min_len),
        "full_payload_chars": full_len,
        "full_recommendation": get_qr_recommendation(full_len)
    }

# =====================================================================
# MAIN RUNNER
# =====================================================================

if __name__ == "__main__":
    print("# GRIDPASS UX & TECH SCHEMA STRESS TEST RESULTS")
    print("Timestamp: 2026-05-22 15:48:00 UTC\n")
    
    print("## 1. GLARE & CONTRAST RATIO METRICS")
    glare_data = run_glare_simulation()
    for item in glare_data:
        print(f"### Scenario: {item['scenario']}")
        print(f"  - Ambient Lighting: {item['lux']:,} lux | Screen Output: {item['nits']} nits")
        print(f"  - Central Dark Glassmorphic Theme:")
        print(f"    * Zero-Glare Contrast: {item['dark_zero']:.2f}:1")
        print(f"    * Real-World Glare Contrast: {item['dark_contrast']:.2f}:1 (WCAG Normal Text Target: 4.5:1)")
        print(f"    * Status: {'FAIL (UNREADABLE)' if item['dark_contrast'] < 3.0 else 'PASS' if item['dark_contrast'] >= 4.5 else 'MARGINAL'}")
        print(f"  - Solar High-Contrast Light Theme:")
        print(f"    * Zero-Glare Contrast: {item['solar_zero']:.2f}:1")
        print(f"    * Real-World Glare Contrast: {item['solar_contrast']:.2f}:1 (WCAG Normal Text Target: 4.5:1)")
        print(f"    * Status: {'FAIL' if item['solar_contrast'] < 3.0 else 'PASS' if item['solar_contrast'] >= 4.5 else 'MARGINAL'}")
        print()
        
    print("## 2. TOUCH ACCURACY & FITTS'S LAW UNDER SCREEN VIBRATION")
    vib_data = run_vibration_simulation()
    for scenario_name, sizes_sim in vib_data.items():
        print(f"### Scenario: {scenario_name}")
        for sim in sizes_sim:
            print(f"  - Target Size: {sim['target_size']}px | Vibration Deviation: {sim['vibration']}px")
            print(f"    * HIT RATE: {sim['hit_rate']*100:.2f}% | MISS RATE: {sim['miss_rate']*100:.2f}% | ADJACENT MISSTAPS: {sim['adjacent_rate']*100:.2f}%")
        print()
        
    print("## 3. BYPASS FLOW & SECURITY HOLE STRESS TEST")
    funnel = GridpassFunnelSimulator()
    
    print("### Case A: Standard Ingress Funnel (OTP Delayed in Valley)")
    otp_fail = funnel.simulate_funnel("SMS_OTP", is_otp_working=False)
    print(f"  - Action: User submits phone under weak signal")
    print(f"  - State Reached: {otp_fail['state']}")
    print(f"  - Code Error: {otp_fail.get('error')}")
    print(f"  - Message: {otp_fail.get('message')}")
    
    print("\n### Case B: Spectator Bypass Guard Stress (Driver attempts Bypass)")
    driver_bypass = funnel.simulate_funnel("BYPASS_LINK", is_otp_working=False, user_selected_type="driver")
    print(f"  - Action: Driver selects bypass link, declares role as 'driver'")
    print(f"  - State Reached: {driver_bypass['state']}")
    print(f"  - Code Error: {driver_bypass.get('error')}")
    print(f"  - Message: {driver_bypass.get('message')}")
    
    print("\n### Case C: Spectator Bypass Guard Exploit (Driver evades Waiver)")
    exploit_bypass = funnel.simulate_funnel("BYPASS_LINK", is_otp_working=False, user_selected_type="spectator")
    print(f"  - Action: Driver selects bypass link, declares role as 'spectator' (EXPLOIT)")
    print(f"  - State Reached: {exploit_bypass['state']}")
    print(f"  - Waiver Signed: {exploit_bypass.get('waiver_signed')}")
    print(f"  - Run Group Mapped: {exploit_bypass.get('run_group')}")
    print(f"  - Exploit Triggered: {exploit_bypass.get('loophole_exploited')}")
    print(f"  - Message: {exploit_bypass.get('message')}")
    print()
    
    print("## 4. OFFLINE CRYPTOGRAPHY & DATA DENSITY VERIFICATION")
    crypto_data = simulate_crypto_and_density()
    print(f"  - Minimal Offline Payload:")
    print(f"    * URL + Signature Length: {crypto_data['min_payload_chars']} characters")
    print(f"    * Scanning Speed Recommendation: {crypto_data['min_recommendation']}")
    print(f"  - Fully-Loaded Offline Payload:")
    print(f"    * URL + Signature Length: {crypto_data['full_payload_chars']} characters")
    print(f"    * Scanning Speed Recommendation: {crypto_data['full_recommendation']}")
    print()
