"""
Cyber Tools Module Test Suite - X=pi by Carbi
Tests 14 REAL functional tools: Port Scanner, DNS Lookup, WHOIS, Hash Generator,
Hash Cracker, Encoder/Decoder, JWT Decoder, Password Generator, Password Analyzer,
Subnet Calculator, HTTP Header Inspector, TCP Ping, Reverse IP
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')


class TestCyberToolsDashboard:
    """Tests for the Cyber Tools Dashboard endpoint"""

    def test_dashboard_returns_14_tools(self):
        """GET /api/tools/dashboard - returns list of 14 tools"""
        response = requests.get(f"{BASE_URL}/api/tools/dashboard", timeout=15)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["total_tools"] == 14, f"Expected 14 tools, got {data['total_tools']}"
        assert data["all_functional"] is True
        assert "tools" in data
        assert len(data["tools"]) >= 13, f"Expected at least 13 tools in list, got {len(data['tools'])}"
        print(f"PASS: Dashboard returns {data['total_tools']} tools")


class TestPortScanner:
    """Tests for the REAL Port Scanner endpoint"""

    def test_port_scan_google(self):
        """POST /api/tools/port-scan - scans google.com ports 80,443,22"""
        payload = {"target": "google.com", "ports": "80,443,22"}
        response = requests.post(f"{BASE_URL}/api/tools/port-scan", json=payload, timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert "results" in data
        assert data["total_scanned"] == 3
        
        # Check that port 80 or 443 is open for google.com
        open_ports = [r["port"] for r in data["results"] if r["state"] == "open"]
        assert 80 in open_ports or 443 in open_ports, f"Expected port 80 or 443 open, got {open_ports}"
        print(f"PASS: Port scan returned {data['open']} open ports, {data['closed']} closed ports")


class TestDnsLookup:
    """Tests for the REAL DNS Lookup endpoint"""

    def test_dns_lookup_google(self):
        """POST /api/tools/dns-lookup - queries google.com DNS records"""
        payload = {"domain": "google.com"}
        response = requests.post(f"{BASE_URL}/api/tools/dns-lookup", json=payload, timeout=20)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert "records" in data
        
        # Google.com should have A, MX, and NS records
        records = data["records"]
        assert "A" in records or "RESOLVED_IP" in records, f"Expected A record, got {records.keys()}"
        print(f"PASS: DNS lookup found {data['records_found']} records for {data['domain']}")


class TestWhoisLookup:
    """Tests for the REAL WHOIS Lookup endpoint"""

    def test_whois_google(self):
        """POST /api/tools/whois - queries google.com WHOIS data"""
        payload = {"domain": "google.com"}
        response = requests.post(f"{BASE_URL}/api/tools/whois", json=payload, timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert "data" in data
        
        whois_data = data["data"]
        # WHOIS should return registrar info
        assert whois_data.get("registrar") is not None or whois_data.get("domain") is not None
        print(f"PASS: WHOIS lookup returned registrar: {whois_data.get('registrar')}")


class TestHashGenerator:
    """Tests for the REAL Hash Generator endpoint"""

    def test_hash_generator_all_algorithms(self):
        """POST /api/tools/hash - generates MD5, SHA1, SHA256, SHA512 hashes for 'test123'"""
        payload = {"text": "test123"}
        response = requests.post(f"{BASE_URL}/api/tools/hash", json=payload, timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert "hashes" in data
        
        hashes = data["hashes"]
        # Verify all standard hashes are present
        assert "md5" in hashes, "Expected MD5 hash"
        assert "sha1" in hashes, "Expected SHA1 hash"
        assert "sha256" in hashes, "Expected SHA256 hash"
        assert "sha512" in hashes, "Expected SHA512 hash"
        
        # Verify MD5 of 'test123' is correct
        expected_md5 = "cc03e747a6afbbcbf8be7668acfebee5"
        assert hashes["md5"] == expected_md5, f"MD5 mismatch: expected {expected_md5}, got {hashes['md5']}"
        print(f"PASS: Hash generator returned {len(hashes)} hash types")


class TestHashCracker:
    """Tests for the REAL Hash Cracker endpoint"""

    def test_crack_password123_md5(self):
        """POST /api/tools/crack-hash - cracks MD5 hash of 'password123'"""
        # MD5 of 'password123' is '482c811da5d5b4bc6d497ffa98491e38'
        payload = {"hash_value": "482c811da5d5b4bc6d497ffa98491e38"}
        response = requests.post(f"{BASE_URL}/api/tools/crack-hash", json=payload, timeout=15)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert data["cracked"] is True, "Expected hash to be cracked"
        assert data["password"] == "password123", f"Expected 'password123', got {data['password']}"
        assert data["detected_type"] == "md5"
        print(f"PASS: Cracked hash in {data['attempts']} attempts, password: {data['password']}")

    def test_crack_unknown_hash(self):
        """POST /api/tools/crack-hash - attempts to crack unknown hash (should fail)"""
        # Random hash that won't match any common password
        payload = {"hash_value": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"}
        response = requests.post(f"{BASE_URL}/api/tools/crack-hash", json=payload, timeout=15)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["cracked"] is False, "Random hash should not be cracked"
        print(f"PASS: Unknown hash not cracked (as expected), attempts: {data['attempts']}")


class TestEncoderDecoder:
    """Tests for the REAL Encoder/Decoder endpoint"""

    def test_base64_encode(self):
        """POST /api/tools/encode - base64 encodes 'Hello World' to SGVsbG8gV29ybGQ="""
        payload = {"text": "Hello World", "operation": "base64_encode"}
        response = requests.post(f"{BASE_URL}/api/tools/encode", json=payload, timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert data["output"] == "SGVsbG8gV29ybGQ=", f"Expected 'SGVsbG8gV29ybGQ=', got {data['output']}"
        print(f"PASS: Base64 encode: '{data['input']}' -> '{data['output']}'")

    def test_base64_decode(self):
        """POST /api/tools/encode - base64 decodes 'SGVsbG8gV29ybGQ=' to Hello World"""
        payload = {"text": "SGVsbG8gV29ybGQ=", "operation": "base64_decode"}
        response = requests.post(f"{BASE_URL}/api/tools/encode", json=payload, timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert data["output"] == "Hello World", f"Expected 'Hello World', got {data['output']}"
        print(f"PASS: Base64 decode: '{data['input']}' -> '{data['output']}'")

    def test_rot13_encode(self):
        """POST /api/tools/encode - ROT13 encodes 'Hello' to 'Uryyb'"""
        payload = {"text": "Hello", "operation": "rot13"}
        response = requests.post(f"{BASE_URL}/api/tools/encode", json=payload, timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert data["output"] == "Uryyb", f"Expected 'Uryyb', got {data['output']}"
        print(f"PASS: ROT13: '{data['input']}' -> '{data['output']}'")

    def test_hex_encode(self):
        """POST /api/tools/encode - hex encodes text"""
        payload = {"text": "Test", "operation": "hex_encode"}
        response = requests.post(f"{BASE_URL}/api/tools/encode", json=payload, timeout=10)
        assert response.status_code == 200
        
        data = response.json()
        assert data["functional"] is True
        assert data["output"] == "54657374", f"Expected '54657374', got {data['output']}"
        print(f"PASS: Hex encode: '{data['input']}' -> '{data['output']}'")


class TestJwtDecoder:
    """Tests for the REAL JWT Decoder endpoint"""

    def test_jwt_decode_valid_token(self):
        """POST /api/tools/jwt-decode - decodes valid JWT token"""
        # Standard JWT test token
        token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        payload = {"token": token}
        response = requests.post(f"{BASE_URL}/api/tools/jwt-decode", json=payload, timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        
        # Verify header
        assert data["header"]["alg"] == "HS256"
        assert data["header"]["typ"] == "JWT"
        
        # Verify payload
        assert data["payload"]["sub"] == "1234567890"
        assert data["payload"]["name"] == "John Doe"
        assert data["payload"]["iat"] == 1516239022
        
        print(f"PASS: JWT decoded - alg: {data['algorithm']}, claims: {data['claims_count']}")

    def test_jwt_decode_invalid_format(self):
        """POST /api/tools/jwt-decode - rejects invalid JWT format"""
        payload = {"token": "not.a.valid.jwt.token"}
        response = requests.post(f"{BASE_URL}/api/tools/jwt-decode", json=payload, timeout=10)
        assert response.status_code == 400, f"Expected 400 for invalid JWT, got {response.status_code}"
        print("PASS: Invalid JWT correctly rejected")


class TestPasswordGenerator:
    """Tests for the REAL Password Generator endpoint"""

    def test_generate_3_passwords_length_16(self):
        """POST /api/tools/password-gen - generates 3 unique 16-char passwords"""
        payload = {"length": 16, "count": 3}
        response = requests.post(f"{BASE_URL}/api/tools/password-gen", json=payload, timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert "passwords" in data
        assert len(data["passwords"]) == 3, f"Expected 3 passwords, got {len(data['passwords'])}"
        
        # Verify each password
        passwords = set()
        for pwd_obj in data["passwords"]:
            assert pwd_obj["length"] == 16, f"Expected length 16, got {pwd_obj['length']}"
            assert len(pwd_obj["password"]) == 16
            passwords.add(pwd_obj["password"])
        
        # All 3 passwords should be unique
        assert len(passwords) == 3, "Expected 3 unique passwords"
        print(f"PASS: Generated {len(data['passwords'])} unique passwords of length 16")


class TestPasswordAnalyzer:
    """Tests for the REAL Password Strength Analyzer endpoint"""

    def test_weak_password(self):
        """POST /api/tools/password-check - identifies 'password' as weak/common"""
        payload = {"password": "password"}
        response = requests.post(f"{BASE_URL}/api/tools/password-check", json=payload, timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert data["is_common"] is True, "Expected 'password' to be identified as common"
        assert data["strength"] in ["MUY DEBIL", "DEBIL"], f"Expected weak strength, got {data['strength']}"
        print(f"PASS: Weak password identified - strength: {data['strength']}, common: {data['is_common']}")

    def test_strong_password(self):
        """POST /api/tools/password-check - identifies complex password as strong"""
        payload = {"password": "MyS3cur3P@ss!2024"}
        response = requests.post(f"{BASE_URL}/api/tools/password-check", json=payload, timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert data["is_common"] is False
        assert data["strength"] in ["FUERTE", "MUY FUERTE"], f"Expected strong, got {data['strength']}"
        assert data["has_uppercase"] is True
        assert data["has_lowercase"] is True
        assert data["has_digits"] is True
        assert data["has_special"] is True
        print(f"PASS: Strong password - strength: {data['strength']}, score: {data['score']}/{data['max_score']}")


class TestSubnetCalculator:
    """Tests for the REAL Subnet Calculator endpoint"""

    def test_subnet_calc_class_c(self):
        """POST /api/tools/subnet - calculates 192.168.1.0/24 (254 usable hosts)"""
        payload = {"cidr": "192.168.1.0/24"}
        response = requests.post(f"{BASE_URL}/api/tools/subnet", json=payload, timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert data["network_address"] == "192.168.1.0"
        assert data["broadcast_address"] == "192.168.1.255"
        assert data["netmask"] == "255.255.255.0"
        assert data["usable_hosts"] == 254, f"Expected 254 usable hosts, got {data['usable_hosts']}"
        assert data["prefix_length"] == 24
        assert data["is_private"] is True
        print(f"PASS: Subnet calc - network: {data['network_address']}, usable hosts: {data['usable_hosts']}")

    def test_subnet_calc_slash_30(self):
        """POST /api/tools/subnet - calculates /30 network (2 usable hosts)"""
        payload = {"cidr": "10.0.0.0/30"}
        response = requests.post(f"{BASE_URL}/api/tools/subnet", json=payload, timeout=10)
        assert response.status_code == 200
        
        data = response.json()
        assert data["usable_hosts"] == 2, f"Expected 2 usable hosts for /30, got {data['usable_hosts']}"
        assert data["total_hosts"] == 4
        print(f"PASS: /30 subnet - usable hosts: {data['usable_hosts']}, total: {data['total_hosts']}")


class TestHttpHeaderInspector:
    """Tests for the REAL HTTP Header Inspector endpoint"""

    def test_http_headers_google(self):
        """POST /api/tools/http-headers - inspects google.com headers"""
        payload = {"url": "google.com"}
        response = requests.post(f"{BASE_URL}/api/tools/http-headers", json=payload, timeout=20)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert "all_headers" in data
        assert "security_headers" in data
        assert data["status_code"] in [200, 301, 302], f"Unexpected status: {data['status_code']}"
        assert data["security_grade"] in ["A", "B", "C", "F"]
        print(f"PASS: HTTP headers - status: {data['status_code']}, grade: {data['security_grade']}, missing: {data['missing_security_headers']}")


class TestTcpPing:
    """Tests for the REAL TCP Ping endpoint"""

    def test_tcp_ping_google(self):
        """POST /api/tools/ping - pings google.com with 3 packets"""
        payload = {"target": "google.com", "count": 3}
        response = requests.post(f"{BASE_URL}/api/tools/ping", json=payload, timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert data["packets_sent"] == 3
        assert "results" in data
        assert len(data["results"]) == 3
        
        # At least some packets should succeed
        assert data["packets_received"] > 0, "Expected at least 1 successful ping"
        print(f"PASS: TCP ping - sent: {data['packets_sent']}, received: {data['packets_received']}, avg: {data['avg_ms']}ms")


class TestReverseIp:
    """Tests for the REAL Reverse IP Lookup endpoint"""

    def test_reverse_ip_google_dns(self):
        """POST /api/tools/reverse-ip - reverse lookup for 8.8.8.8"""
        payload = {"ip": "8.8.8.8"}
        response = requests.post(f"{BASE_URL}/api/tools/reverse-ip", json=payload, timeout=15)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["functional"] is True
        assert data["ip"] == "8.8.8.8"
        
        # 8.8.8.8 should resolve to dns.google
        assert "hostname" in data
        print(f"PASS: Reverse IP - {data['ip']} -> {data['hostname']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
