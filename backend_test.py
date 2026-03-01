#!/usr/bin/env python3
"""
Backend API Testing Script for X=π by Carbi Cybersecurity Toolkit
Tests all backend endpoints to ensure proper functionality
"""

import asyncio
import httpx
import json
import sys
from typing import Dict, Any, List
from datetime import datetime

# API Base URL from frontend environment
API_BASE_URL = "https://deep-search-mx.preview.emergentagent.com/api"

class TestResult:
    def __init__(self, name: str, success: bool, details: str = "", data: Any = None):
        self.name = name
        self.success = success
        self.details = details
        self.data = data
        self.timestamp = datetime.now()

class APITester:
    def __init__(self):
        self.results: List[TestResult] = []
        self.client = None
    
    async def setup(self):
        """Setup HTTP client"""
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
    
    async def cleanup(self):
        """Cleanup HTTP client"""
        if self.client:
            await self.client.aclose()
    
    def add_result(self, name: str, success: bool, details: str = "", data: Any = None):
        """Add test result"""
        result = TestResult(name, success, details, data)
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {name}")
        if details:
            print(f"    Details: {details}")
        if not success:
            print(f"    Data: {data}")
        print()
    
    async def test_root_endpoint(self):
        """Test GET /api/ endpoint"""
        try:
            response = await self.client.get(f"{API_BASE_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                if "X=π by Carbi" in data.get("message", ""):
                    self.add_result(
                        "Root Endpoint", 
                        True, 
                        f"Status: {response.status_code}, Message: {data.get('message')}"
                    )
                else:
                    self.add_result(
                        "Root Endpoint", 
                        False, 
                        f"Incorrect message format. Expected 'X=π by Carbi' in message", 
                        data
                    )
            else:
                self.add_result(
                    "Root Endpoint", 
                    False, 
                    f"Unexpected status code: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.add_result("Root Endpoint", False, f"Request failed: {str(e)}")
    
    async def test_osint_scan(self):
        """Test POST /api/osint/scan endpoint"""
        try:
            test_data = {"username": "elonmusk"}
            response = await self.client.post(
                f"{API_BASE_URL}/osint/scan",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response is a list
                if not isinstance(data, list):
                    self.add_result(
                        "OSINT Scanner", 
                        False, 
                        "Response is not a list of results", 
                        data
                    )
                    return
                
                # Check if we have multiple platforms
                if len(data) < 5:
                    self.add_result(
                        "OSINT Scanner", 
                        False, 
                        f"Expected multiple platforms, got {len(data)}", 
                        data
                    )
                    return
                
                # Check structure of results
                required_fields = ["platform", "url", "exists", "status"]
                for i, result in enumerate(data[:3]):  # Check first 3 results
                    for field in required_fields:
                        if field not in result:
                            self.add_result(
                                "OSINT Scanner", 
                                False, 
                                f"Missing field '{field}' in result {i}", 
                                result
                            )
                            return
                
                # Count successful checks
                found_count = sum(1 for r in data if r.get("exists") == True)
                total_count = len(data)
                
                self.add_result(
                    "OSINT Scanner", 
                    True, 
                    f"Scanned {total_count} platforms, found {found_count} matches for username 'elonmusk'"
                )
            else:
                self.add_result(
                    "OSINT Scanner", 
                    False, 
                    f"Unexpected status code: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.add_result("OSINT Scanner", False, f"Request failed: {str(e)}")
    
    async def test_password_check(self):
        """Test POST /api/password/check endpoint"""
        try:
            test_data = {"password": "password123"}
            response = await self.client.post(
                f"{API_BASE_URL}/password/check",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["is_pwned", "breach_count", "strength", "suggestions"]
                for field in required_fields:
                    if field not in data:
                        self.add_result(
                            "Password Checker", 
                            False, 
                            f"Missing field '{field}' in response", 
                            data
                        )
                        return
                
                # Validate field types
                if not isinstance(data["is_pwned"], bool):
                    self.add_result(
                        "Password Checker", 
                        False, 
                        "is_pwned should be boolean", 
                        data
                    )
                    return
                
                if not isinstance(data["breach_count"], int):
                    self.add_result(
                        "Password Checker", 
                        False, 
                        "breach_count should be integer", 
                        data
                    )
                    return
                
                if not isinstance(data["suggestions"], list):
                    self.add_result(
                        "Password Checker", 
                        False, 
                        "suggestions should be list", 
                        data
                    )
                    return
                
                # Password123 should be pwned
                pwned_status = "IS PWNED" if data["is_pwned"] else "NOT PWNED"
                self.add_result(
                    "Password Checker", 
                    True, 
                    f"Password 'password123' {pwned_status}, Strength: {data['strength']}, Breaches: {data['breach_count']}"
                )
            else:
                self.add_result(
                    "Password Checker", 
                    False, 
                    f"Unexpected status code: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.add_result("Password Checker", False, f"Request failed: {str(e)}")
    
    async def test_website_analyze(self):
        """Test POST /api/website/analyze endpoint"""
        try:
            test_data = {"url": "https://github.com"}
            response = await self.client.post(
                f"{API_BASE_URL}/website/analyze",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["url", "status_code", "headers", "overall_score", "recommendations"]
                for field in required_fields:
                    if field not in data:
                        self.add_result(
                            "Website Analyzer", 
                            False, 
                            f"Missing field '{field}' in response", 
                            data
                        )
                        return
                
                # Validate headers structure
                if not isinstance(data["headers"], list):
                    self.add_result(
                        "Website Analyzer", 
                        False, 
                        "headers should be list", 
                        data
                    )
                    return
                
                # Check header structure
                if data["headers"]:
                    header = data["headers"][0]
                    header_fields = ["header", "present", "risk_level"]
                    for field in header_fields:
                        if field not in header:
                            self.add_result(
                                "Website Analyzer", 
                                False, 
                                f"Missing field '{field}' in header object", 
                                header
                            )
                            return
                
                headers_checked = len(data["headers"])
                present_headers = sum(1 for h in data["headers"] if h.get("present"))
                
                self.add_result(
                    "Website Analyzer", 
                    True, 
                    f"Analyzed {data['url']}, Status: {data['status_code']}, Score: {data['overall_score']}, Headers: {present_headers}/{headers_checked}"
                )
            else:
                self.add_result(
                    "Website Analyzer", 
                    False, 
                    f"Unexpected status code: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.add_result("Website Analyzer", False, f"Request failed: {str(e)}")
    
    async def test_ai_chat(self):
        """Test POST /api/chat endpoint"""
        try:
            test_data = {
                "session_id": "test_session_123",
                "message": "What is phishing?"
            }
            response = await self.client.post(
                f"{API_BASE_URL}/chat",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["response", "session_id"]
                for field in required_fields:
                    if field not in data:
                        self.add_result(
                            "AI Security Chat", 
                            False, 
                            f"Missing field '{field}' in response", 
                            data
                        )
                        return
                
                # Check if response contains cybersecurity content
                response_text = data["response"].lower()
                if "phishing" in response_text or "email" in response_text or "security" in response_text:
                    # Check for X=π signature
                    if "x=π" in data["response"].lower() or "carbi" in data["response"].lower():
                        self.add_result(
                            "AI Security Chat", 
                            True, 
                            f"AI responded about phishing with X=π signature. Response length: {len(data['response'])} chars"
                        )
                    else:
                        self.add_result(
                            "AI Security Chat", 
                            True, 
                            f"AI responded about phishing but missing X=π signature. Response length: {len(data['response'])} chars"
                        )
                else:
                    self.add_result(
                        "AI Security Chat", 
                        False, 
                        "Response doesn't seem to address cybersecurity question", 
                        data["response"][:200]
                    )
            else:
                self.add_result(
                    "AI Security Chat", 
                    False, 
                    f"Unexpected status code: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.add_result("AI Security Chat", False, f"Request failed: {str(e)}")
    
    async def test_scan_history(self):
        """Test GET /api/history endpoint"""
        try:
            response = await self.client.get(f"{API_BASE_URL}/history")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response is a list
                if not isinstance(data, list):
                    self.add_result(
                        "Scan History", 
                        False, 
                        "Response is not a list", 
                        data
                    )
                    return
                
                # If we have history, check structure
                if data:
                    history_item = data[0]
                    required_fields = ["id", "scan_type", "target", "result_summary", "timestamp"]
                    for field in required_fields:
                        if field not in history_item:
                            self.add_result(
                                "Scan History", 
                                False, 
                                f"Missing field '{field}' in history item", 
                                history_item
                            )
                            return
                
                self.add_result(
                    "Scan History", 
                    True, 
                    f"Retrieved {len(data)} history entries"
                )
            else:
                self.add_result(
                    "Scan History", 
                    False, 
                    f"Unexpected status code: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.add_result("Scan History", False, f"Request failed: {str(e)}")
    
    async def run_all_tests(self):
        """Run all API tests"""
        print(f"🔍 Testing X=π by Carbi Cybersecurity Toolkit API")
        print(f"📡 API Base URL: {API_BASE_URL}")
        print("=" * 60)
        
        await self.setup()
        
        # Run tests in sequence
        await self.test_root_endpoint()
        await self.test_osint_scan()
        await self.test_password_check()
        await self.test_website_analyze()
        await self.test_ai_chat()
        await self.test_scan_history()
        
        await self.cleanup()
        
        # Print summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r.success)
        total = len(self.results)
        
        for result in self.results:
            status = "✅" if result.success else "❌"
            print(f"{status} {result.name}")
        
        print()
        print(f"📈 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed!")
            return False

async def main():
    """Main test runner"""
    tester = APITester()
    success = await tester.run_all_tests()
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())