"""
Backend API Tests for X=pi by Carbi - New Modules
Tests the 4 new modules: Secret Scanner, Google Dorks, Mexico OSINT v2, Real APIs
"""

import pytest
import requests
import os
from datetime import datetime

# Get BASE_URL from environment - use the public endpoint
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Fallback for local testing
    BASE_URL = "https://xpi-cybersecurity.preview.emergentagent.com"

class TestSecretScanner:
    """Secret Scanner module tests - 3 endpoints"""

    def test_scan_text_for_secrets_with_aws_key(self):
        """POST /api/secrets/scan - scan text for exposed API keys"""
        response = requests.post(
            f"{BASE_URL}/api/secrets/scan",
            json={"text": "My AWS key is AKIAIOSFODNN7EXAMPLE and my secret is xyz123"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_secrets_found" in data
        assert "matches" in data
        assert "risk_summary" in data
        assert "scan_mode" in data
        assert "timestamp" in data
        
        # Should find at least the AWS key
        assert data["total_secrets_found"] >= 1, "Should detect at least the AWS Access Key"
        print(f"Found {data['total_secrets_found']} secrets")

    def test_scan_empty_text_returns_error(self):
        """POST /api/secrets/scan - empty/short text should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/secrets/scan",
            json={"text": "ab"}  # Too short
        )
        assert response.status_code == 400, f"Expected 400 for short text, got {response.status_code}"

    def test_get_all_patterns(self):
        """GET /api/secrets/patterns - get all 68 detection patterns"""
        response = requests.get(f"{BASE_URL}/api/secrets/patterns")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_patterns" in data
        assert "categories" in data
        assert "module" in data
        # Verify we have the expected number of patterns (68 as per docs)
        # Allow some variation
        assert data["total_patterns"] >= 50, f"Expected at least 50 patterns, got {data['total_patterns']}"
        print(f"Total patterns: {data['total_patterns']}")

    def test_get_keyhacks_database(self):
        """GET /api/secrets/keyhacks - get 25 keyhacks verification methods"""
        response = requests.get(f"{BASE_URL}/api/secrets/keyhacks")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_services" in data
        assert "keyhacks" in data
        assert isinstance(data["keyhacks"], list)
        # Should have around 25 keyhacks
        assert len(data["keyhacks"]) >= 20, f"Expected at least 20 keyhacks, got {len(data['keyhacks'])}"
        
        # Verify keyhack structure
        if data["keyhacks"]:
            keyhack = data["keyhacks"][0]
            assert "service" in keyhack
            assert "verify_cmd" in keyhack
        print(f"Total keyhacks: {data['total_services']}")


class TestGoogleDorks:
    """Google Dorks module tests - 4 endpoints"""

    def test_get_dorks_database(self):
        """GET /api/dorks/database - get 50 Google dorks"""
        response = requests.get(f"{BASE_URL}/api/dorks/database")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_dorks" in data
        assert "dorks" in data
        assert "categories" in data
        assert isinstance(data["dorks"], list)
        
        # Should have around 50 dorks
        assert data["total_dorks"] >= 40, f"Expected at least 40 dorks, got {data['total_dorks']}"
        
        # Verify dork structure
        if data["dorks"]:
            dork = data["dorks"][0]
            assert "id" in dork
            assert "category" in dork
            assert "dork" in dork
            assert "risk" in dork
        print(f"Total dorks: {data['total_dorks']}")

    def test_get_search_operators(self):
        """GET /api/dorks/operators - get 22 search operators"""
        response = requests.get(f"{BASE_URL}/api/dorks/operators")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_operators" in data
        assert "operators" in data
        assert isinstance(data["operators"], list)
        
        # Should have around 22 operators
        assert data["total_operators"] >= 20, f"Expected at least 20 operators, got {data['total_operators']}"
        
        # Verify operator structure
        if data["operators"]:
            op = data["operators"][0]
            assert "operator" in op
            assert "description" in op
            assert "syntax" in op
        print(f"Total operators: {data['total_operators']}")

    def test_build_custom_dork_general(self):
        """POST /api/dorks/build?target=example.com&dork_type=general - build custom dorks"""
        response = requests.post(
            f"{BASE_URL}/api/dorks/build?target=example.com&dork_type=general"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "target" in data
        assert "dork_type" in data
        assert "generated_dorks" in data
        assert data["target"] == "example.com"
        assert data["dork_type"] == "general"
        assert isinstance(data["generated_dorks"], list)
        assert len(data["generated_dorks"]) > 0, "Should generate at least one dork"
        print(f"Generated {len(data['generated_dorks'])} dorks for example.com")

    def test_build_custom_dork_credentials(self):
        """POST /api/dorks/build with credentials type"""
        response = requests.post(
            f"{BASE_URL}/api/dorks/build?target=testsite.com&dork_type=credentials"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["dork_type"] == "credentials"
        assert len(data["generated_dorks"]) > 0

    def test_build_custom_dork_empty_target_fails(self):
        """POST /api/dorks/build with empty target should fail"""
        response = requests.post(f"{BASE_URL}/api/dorks/build?target=&dork_type=general")
        assert response.status_code == 400, f"Expected 400 for empty target, got {response.status_code}"


class TestMexicoOSINT:
    """Mexico OSINT v2 module tests - 7 endpoints"""

    def test_get_states(self):
        """GET /api/mexico/states - get 32 Mexican states"""
        response = requests.get(f"{BASE_URL}/api/mexico/states")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_states" in data
        assert "states" in data
        assert isinstance(data["states"], list)
        
        # Mexico has 32 states
        assert data["total_states"] == 32, f"Expected 32 states, got {data['total_states']}"
        
        # Verify state structure
        if data["states"]:
            state = data["states"][0]
            assert "code" in state
            assert "name" in state
            assert "capital" in state
            assert "population" in state
        print(f"Total states: {data['total_states']}")

    def test_get_cities(self):
        """GET /api/mexico/cities - get 20 major cities"""
        response = requests.get(f"{BASE_URL}/api/mexico/cities")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_cities" in data
        assert "cities" in data
        assert isinstance(data["cities"], list)
        
        # Should have at least 20 major cities
        assert data["total_cities"] >= 20, f"Expected at least 20 cities, got {data['total_cities']}"
        
        # Verify city structure
        if data["cities"]:
            city = data["cities"][0]
            assert "name" in city
            assert "state" in city
            assert "population" in city
        print(f"Total cities: {data['total_cities']}")

    def test_lookup_zipcode_valid(self):
        """GET /api/mexico/zipcode/06600 - lookup zip code"""
        response = requests.get(f"{BASE_URL}/api/mexico/zipcode/06600")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "zip_code" in data
        assert "state" in data
        assert data["zip_code"] == "06600"
        
        # 06600 is in Ciudad de Mexico (CMX)
        assert data["state"]["code"] == "CMX", f"Expected CMX, got {data['state']['code']}"
        print(f"Zip 06600 is in: {data['state']['name']}")

    def test_lookup_zipcode_invalid(self):
        """GET /api/mexico/zipcode/invalid - should fail"""
        response = requests.get(f"{BASE_URL}/api/mexico/zipcode/invalid")
        assert response.status_code == 400, f"Expected 400 for invalid zip, got {response.status_code}"

    def test_validate_curp_valid(self):
        """POST /api/mexico/validate/curp?curp=GARC850101HDFRRL09 - validate CURP"""
        response = requests.post(
            f"{BASE_URL}/api/mexico/validate/curp?curp=GARC850101HDFRRL09"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "valid" in data
        assert "curp" in data
        assert data["valid"] == True, f"Expected valid CURP, got {data}"
        assert "decoded" in data
        
        # Verify decoded data
        decoded = data["decoded"]
        assert "sex" in decoded
        assert "state_of_birth" in decoded
        print(f"CURP decoded: {decoded}")

    def test_validate_curp_invalid(self):
        """POST /api/mexico/validate/curp with invalid CURP"""
        response = requests.post(
            f"{BASE_URL}/api/mexico/validate/curp?curp=INVALID123"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["valid"] == False, "Invalid CURP should return valid=False"

    def test_get_telecom_operators(self):
        """GET /api/mexico/telecom - get 8 telecom operators"""
        response = requests.get(f"{BASE_URL}/api/mexico/telecom")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_operators" in data
        assert "operators" in data
        assert isinstance(data["operators"], list)
        
        # Should have 8 operators
        assert data["total_operators"] == 8, f"Expected 8 operators, got {data['total_operators']}"
        
        # Verify operator structure
        if data["operators"]:
            op = data["operators"][0]
            assert "name" in op
            assert "type" in op
            assert "market_share" in op
        print(f"Total telecom operators: {data['total_operators']}")

    def test_get_mexico_dashboard(self):
        """GET /api/mexico/dashboard - Mexico OSINT dashboard"""
        response = requests.get(f"{BASE_URL}/api/mexico/dashboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "module" in data
        assert "available_data" in data
        assert "tools" in data
        
        # Verify available_data counts
        available = data["available_data"]
        assert available["states"] == 32
        assert available["telecom_operators"] == 8
        print(f"Dashboard available data: {available}")


class TestRealAPIs:
    """Real APIs module tests - Live external API calls"""

    def test_ip_lookup_google_dns(self):
        """POST /api/real/ip-lookup with {ip: '8.8.8.8'} - real Shodan+IP lookup"""
        response = requests.post(
            f"{BASE_URL}/api/real/ip-lookup",
            json={"ip": "8.8.8.8"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "api" in data
        assert "real_data" in data
        assert data["real_data"] == True
        assert "ip" in data
        assert "geolocation" in data
        assert "shodan_data" in data
        
        # Verify geolocation
        geo = data["geolocation"]
        assert "country" in geo
        # 8.8.8.8 is Google DNS in USA
        assert "United States" in geo["country"] or geo["country"] == "United States", f"Expected US, got {geo['country']}"
        print(f"IP 8.8.8.8 geolocation: {geo['country']}, {geo['city']}")

    def test_breach_check_email(self):
        """POST /api/real/breach-check with {email: 'test@test.com'} - HIBP check"""
        response = requests.post(
            f"{BASE_URL}/api/real/breach-check",
            json={"email": "test@test.com"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "api" in data
        assert "real_data" in data
        assert "email" in data
        assert data["email"] == "test@test.com"
        assert "found_in_breaches" in data
        assert "risk_level" in data
        print(f"Breach check result: found={data['found_in_breaches']}, risk={data['risk_level']}")

    def test_ssl_check_google(self):
        """POST /api/real/ssl-check with {domain: 'google.com'} - real SSL check"""
        response = requests.post(
            f"{BASE_URL}/api/real/ssl-check",
            json={"domain": "google.com"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "api" in data
        assert "real_data" in data
        assert data["real_data"] == True
        assert "domain" in data
        assert "certificates" in data or "error" in data
        
        if "certificates" in data:
            assert isinstance(data["certificates"], list)
            print(f"SSL check for google.com: {data['total_certs']} total certs, {data['unique_certs']} unique")
        else:
            print(f"SSL check returned: {data}")

    def test_weather_data_mexico_city(self):
        """GET /api/real/weather/19.43/-99.13 - real weather data"""
        response = requests.get(f"{BASE_URL}/api/real/weather/19.43/-99.13")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "api" in data
        assert "real_data" in data
        assert data["real_data"] == True
        assert "location" in data
        assert "current" in data
        
        # Verify current weather data
        current = data["current"]
        assert "temperature_c" in current
        assert "humidity" in current
        print(f"Weather at Mexico City: {current['temperature_c']}C, {current['humidity']}% humidity")

    def test_safe_browsing_google(self):
        """POST /api/real/safe-browsing with {url: 'https://google.com'} - Google Safe Browsing"""
        # Note: May return 403 due to API key permissions (known issue per review_request)
        response = requests.post(
            f"{BASE_URL}/api/real/safe-browsing",
            json={"url": "https://google.com"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "api" in data
        assert "url" in data
        
        # May have error due to API key permissions - this is known/expected
        if "error" in data:
            print(f"Safe Browsing API returned error (known issue): {data['error']}")
        else:
            assert "safe" in data
            assert data["safe"] == True  # google.com should be safe
            print(f"Safe Browsing check: google.com is safe={data['safe']}")


class TestHealthAndBasics:
    """Basic health and connectivity tests"""

    def test_api_root_endpoint(self):
        """GET /api/ - verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"API root not accessible: {response.status_code}"
        
        data = response.json()
        assert "message" in data
        assert "X=π" in data["message"] or "Carbi" in data["message"]
        print(f"API message: {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
