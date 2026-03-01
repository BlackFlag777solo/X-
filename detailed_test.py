#!/usr/bin/env python3
"""
Detailed Backend API Testing - Edge Cases and Data Structure Validation
"""

import asyncio
import httpx
import json
from datetime import datetime

API_BASE_URL = "https://bold-faraday.preview.emergentagent.com/api"

async def test_edge_cases():
    """Test edge cases and data structure validation"""
    print("🔍 Running Detailed Edge Case Tests")
    print("=" * 50)
    
    client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
    
    try:
        # Test 1: OSINT with non-existent username
        print("1️⃣  Testing OSINT with rare username...")
        response = await client.post(
            f"{API_BASE_URL}/osint/scan",
            json={"username": "veryunlikelyusername12345xyz"}
        )
        if response.status_code == 200:
            data = response.json()
            found_count = sum(1 for r in data if r.get("exists") == True)
            print(f"   ✅ OSINT scan completed: {found_count}/{len(data)} platforms found matches")
        else:
            print(f"   ❌ OSINT failed: {response.status_code}")
        
        # Test 2: Password with strong password
        print("2️⃣  Testing password checker with strong password...")
        response = await client.post(
            f"{API_BASE_URL}/password/check",
            json={"password": "MyVeryStr0ng!Passw0rd#2024$"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Strong password check: {data['strength']}, Pwned: {data['is_pwned']}")
        else:
            print(f"   ❌ Password check failed: {response.status_code}")
        
        # Test 3: Website analyzer with different domain
        print("3️⃣  Testing website analyzer with different domain...")
        response = await client.post(
            f"{API_BASE_URL}/website/analyze",
            json={"url": "https://stackoverflow.com"}
        )
        if response.status_code == 200:
            data = response.json()
            security_score = data['overall_score']
            headers_count = len(data['headers'])
            print(f"   ✅ Website analysis: Score {security_score}, {headers_count} headers checked")
        else:
            print(f"   ❌ Website analysis failed: {response.status_code}")
        
        # Test 4: AI Chat with cybersecurity question
        print("4️⃣  Testing AI chat with technical question...")
        response = await client.post(
            f"{API_BASE_URL}/chat",
            json={
                "session_id": "detailed_test_session",
                "message": "Explain the difference between symmetric and asymmetric encryption"
            }
        )
        if response.status_code == 200:
            data = response.json()
            response_text = data['response']
            has_signature = "x=π" in response_text.lower() or "carbi" in response_text.lower()
            print(f"   ✅ AI chat response: {len(response_text)} chars, Has signature: {has_signature}")
        else:
            print(f"   ❌ AI chat failed: {response.status_code}")
        
        # Test 5: Verify scan history is being populated
        print("5️⃣  Checking scan history population...")
        response = await client.get(f"{API_BASE_URL}/history")
        if response.status_code == 200:
            data = response.json()
            if data:
                recent_scans = [item['scan_type'] for item in data[:5]]
                print(f"   ✅ History populated: {len(data)} total entries")
                print(f"   Recent scan types: {', '.join(recent_scans)}")
            else:
                print(f"   ⚠️  No history entries found")
        else:
            print(f"   ❌ History check failed: {response.status_code}")
            
        # Test 6: Verify data structure consistency
        print("6️⃣  Verifying OSINT data structure...")
        response = await client.post(
            f"{API_BASE_URL}/osint/scan",
            json={"username": "testuser"}
        )
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                first_result = data[0]
                required_fields = ["platform", "url", "exists", "status"]
                missing_fields = [f for f in required_fields if f not in first_result]
                if not missing_fields:
                    print(f"   ✅ OSINT structure valid: All {len(required_fields)} fields present")
                else:
                    print(f"   ❌ Missing fields: {missing_fields}")
            else:
                print(f"   ❌ No OSINT results returned")
        
        print("=" * 50)
        print("🎯 Edge case testing completed!")
        
    finally:
        await client.aclose()

async def main():
    await test_edge_cases()

if __name__ == "__main__":
    asyncio.run(main())