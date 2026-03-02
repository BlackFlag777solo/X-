#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://hacker-c2-lab.preview.emergentagent.com/api"

def log_result(endpoint, status, details=""):
    """Log test result"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {endpoint}: {status}")
    if details:
        print(f"    {details}")

def test_endpoint(method, endpoint, expected_status=200, params=None, test_name=None):
    """Test a single API endpoint"""
    url = f"{BACKEND_URL}{endpoint}"
    test_description = test_name or f"{method} {endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, params=params, timeout=15)
        elif method.upper() == "POST":
            response = requests.post(url, json=params or {}, timeout=15)
        else:
            log_result(test_description, "FAIL", f"Unsupported method: {method}")
            return False
        
        if response.status_code == expected_status:
            try:
                data = response.json()
                log_result(test_description, "PASS", f"Status: {response.status_code}, Data keys: {list(data.keys()) if isinstance(data, dict) else 'Non-dict response'}")
                return True
            except json.JSONDecodeError:
                log_result(test_description, "FAIL", f"Status: {response.status_code}, Invalid JSON response")
                return False
        else:
            log_result(test_description, "FAIL", f"Expected: {expected_status}, Got: {response.status_code}, Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.RequestException as e:
        log_result(test_description, "FAIL", f"Request failed: {str(e)}")
        return False

def test_cellular_endpoints():
    """Test all cellular intelligence endpoints"""
    print(f"🧪 TESTING CELLULAR INTELLIGENCE MODULE")
    print(f"📡 Backend URL: {BACKEND_URL}")
    print("=" * 80)
    
    results = []
    
    # Test 1: Dashboard
    print("\n1️⃣ Testing Dashboard Endpoint")
    result = test_endpoint("GET", "/cellular/dashboard", 200, None, "Cellular Dashboard")
    results.append(("Dashboard", result))
    
    # Test 2: All Tools
    print("\n2️⃣ Testing Tools Endpoints")
    result = test_endpoint("GET", "/cellular/tools", 200, None, "All Tools")
    results.append(("All Tools", result))
    
    # Test 3: Tools with search
    result = test_endpoint("GET", "/cellular/tools", 200, {"search": "srsRAN"}, "Tools Search (srsRAN)")
    results.append(("Tools Search", result))
    
    # Test 4: Tools with category
    result = test_endpoint("GET", "/cellular/tools", 200, {"category": "Analysis Tools"}, "Tools Category Filter")
    results.append(("Tools Category", result))
    
    # Test 5: Specific tool
    result = test_endpoint("GET", "/cellular/tools/tool-001", 200, None, "Specific Tool (tool-001)")
    results.append(("Specific Tool", result))
    
    # Test 6: Hardware
    print("\n3️⃣ Testing Hardware Endpoints")
    result = test_endpoint("GET", "/cellular/hardware", 200, None, "All Hardware")
    results.append(("All Hardware", result))
    
    # Test 7: Hardware with manufacturer filter
    result = test_endpoint("GET", "/cellular/hardware", 200, {"manufacturer": "Ettus"}, "Hardware Manufacturer Filter")
    results.append(("Hardware Filter", result))
    
    # Test 8: Attack Vectors
    print("\n4️⃣ Testing Attack Vectors Endpoints")
    result = test_endpoint("GET", "/cellular/attack-vectors", 200, None, "All Attack Vectors")
    results.append(("All Attack Vectors", result))
    
    # Test 9: Attack vectors with severity
    result = test_endpoint("GET", "/cellular/attack-vectors", 200, {"severity": "CRITICAL"}, "Attack Vectors Severity Filter")
    results.append(("Attack Vectors Filter", result))
    
    # Test 10: Specific attack vector
    result = test_endpoint("GET", "/cellular/attack-vectors/atk-001", 200, None, "Specific Attack Vector")
    results.append(("Specific Attack Vector", result))
    
    # Test 11: Research papers
    print("\n5️⃣ Testing Research Endpoints")
    result = test_endpoint("GET", "/cellular/research", 200, None, "All Research Papers")
    results.append(("All Research", result))
    
    # Test 12: Research with year filter
    result = test_endpoint("GET", "/cellular/research", 200, {"year": 2024}, "Research Year Filter")
    results.append(("Research Filter", result))
    
    # Test 13: Detection & Defense
    print("\n6️⃣ Testing Detection & Defense")
    result = test_endpoint("GET", "/cellular/detection-defense", 200, None, "Detection & Defense Tools")
    results.append(("Detection Defense", result))
    
    # Test 14: Mexico Telecom
    print("\n7️⃣ Testing Mexico Telecom Intelligence")
    result = test_endpoint("GET", "/cellular/mexico-telecom", 200, None, "Mexico Telecom Info")
    results.append(("Mexico Telecom", result))
    
    # Test 15: SIM Security
    print("\n8️⃣ Testing SIM Security")
    result = test_endpoint("GET", "/cellular/sim-security", 200, None, "SIM Security Analysis")
    results.append(("SIM Security", result))
    
    # Test 16: SS7 Analysis
    print("\n9️⃣ Testing SS7 Analysis")
    result = test_endpoint("GET", "/cellular/ss7-analysis", 200, None, "SS7 Analysis")
    results.append(("SS7 Analysis", result))
    
    # Test 17: 5G Security
    print("\n🔟 Testing 5G Security")
    result = test_endpoint("GET", "/cellular/5g-security", 200, None, "5G Security Analysis")
    results.append(("5G Security", result))
    
    # Test 18: Forensics
    print("\n1️⃣1️⃣ Testing Forensics")
    result = test_endpoint("GET", "/cellular/forensics", 200, None, "Mobile Forensics Tools")
    results.append(("Forensics", result))
    
    # Test 19: Real-time Scan
    print("\n1️⃣2️⃣ Testing Real-time Scan")
    result = test_endpoint("GET", "/cellular/realtime-scan", 200, None, "Real-time Cellular Scan")
    results.append(("Realtime Scan", result))
    
    # Test 20: Existing root endpoint (sanity check)
    print("\n1️⃣3️⃣ Testing Root Endpoint (Sanity Check)")
    result = test_endpoint("GET", "/", 200, None, "API Root Endpoint")
    results.append(("Root Endpoint", result))
    
    return results

def test_existing_endpoints():
    """Test existing endpoints to ensure they still work"""
    print("\n🔄 TESTING EXISTING ENDPOINTS (REGRESSION)")
    print("=" * 80)
    
    existing_results = []
    
    # Test existing OSINT
    print("\n📊 Testing Existing OSINT Scanner")
    result = test_endpoint("POST", "/osint/scan", 200, {"username": "elonmusk"}, "OSINT Scanner")
    existing_results.append(("OSINT Scanner", result))
    
    # Test existing Password Checker
    print("\n🔒 Testing Existing Password Checker")
    result = test_endpoint("POST", "/password/check", 200, {"password": "test123"}, "Password Checker")
    existing_results.append(("Password Checker", result))
    
    # Test existing Website Analyzer
    print("\n🌐 Testing Existing Website Analyzer")
    result = test_endpoint("POST", "/website/analyze", 200, {"url": "https://google.com"}, "Website Analyzer")
    existing_results.append(("Website Analyzer", result))
    
    # Test existing AI Chat
    print("\n🤖 Testing Existing AI Chat")
    result = test_endpoint("POST", "/chat", 200, {
        "session_id": "test-session-123", 
        "message": "What is cellular security?"
    }, "AI Security Chat")
    existing_results.append(("AI Chat", result))
    
    # Test existing History
    print("\n📜 Testing Existing History")
    result = test_endpoint("GET", "/history", 200, None, "Scan History")
    existing_results.append(("History", result))
    
    return existing_results

def generate_summary(cellular_results, existing_results):
    """Generate test summary"""
    print("\n" + "=" * 80)
    print("📋 TEST SUMMARY")
    print("=" * 80)
    
    # Cellular endpoints summary
    cellular_passed = sum(1 for _, result in cellular_results if result)
    cellular_total = len(cellular_results)
    
    print(f"\n🔬 CELLULAR INTELLIGENCE MODULE:")
    print(f"   ✅ Passed: {cellular_passed}/{cellular_total}")
    print(f"   ❌ Failed: {cellular_total - cellular_passed}/{cellular_total}")
    
    if cellular_passed < cellular_total:
        print(f"\n   Failed tests:")
        for name, result in cellular_results:
            if not result:
                print(f"   ❌ {name}")
    
    # Existing endpoints summary
    existing_passed = sum(1 for _, result in existing_results if result)
    existing_total = len(existing_results)
    
    print(f"\n🔄 EXISTING ENDPOINTS (Regression):")
    print(f"   ✅ Passed: {existing_passed}/{existing_total}")
    print(f"   ❌ Failed: {existing_total - existing_passed}/{existing_total}")
    
    if existing_passed < existing_total:
        print(f"\n   Failed existing tests:")
        for name, result in existing_results:
            if not result:
                print(f"   ❌ {name}")
    
    # Overall summary
    total_passed = cellular_passed + existing_passed
    total_tests = cellular_total + existing_total
    
    print(f"\n🎯 OVERALL RESULTS:")
    print(f"   Total Tests: {total_tests}")
    print(f"   Passed: {total_passed}")
    print(f"   Failed: {total_tests - total_passed}")
    print(f"   Success Rate: {(total_passed/total_tests)*100:.1f}%")
    
    if total_passed == total_tests:
        print(f"\n🎉 ALL TESTS PASSED! Cellular Intelligence module is fully functional.")
    else:
        print(f"\n⚠️  Some tests failed. Check the logs above for details.")
    
    return total_passed == total_tests

if __name__ == "__main__":
    print("🚀 STARTING CELLULAR INTELLIGENCE BACKEND TESTING")
    print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test new cellular endpoints
    cellular_results = test_cellular_endpoints()
    
    # Test existing endpoints for regression
    existing_results = test_existing_endpoints()
    
    # Generate summary
    success = generate_summary(cellular_results, existing_results)
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)