# ============================================================================
# CYBER TOOLS MODULE - X=pi by Carbi
# REAL FUNCTIONAL TOOLS - Not informational, these actually DO things
# ============================================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import socket
import hashlib
import base64
import binascii
import json
import struct
import ipaddress
import ssl
import secrets
import string
import re
import asyncio

tools_router = APIRouter(prefix="/api/tools", tags=["Cyber Tools"])

# ============================================================================
# MODELS
# ============================================================================

class PortScanReq(BaseModel):
    target: str
    ports: Optional[str] = "21,22,23,25,53,80,110,143,443,445,993,995,3306,3389,5432,6379,8080,8443,27017"
    timeout: Optional[float] = 1.5

class DnsReq(BaseModel):
    domain: str
    record_type: Optional[str] = "ALL"

class WhoisReq(BaseModel):
    domain: str

class HashReq(BaseModel):
    text: str
    algorithm: Optional[str] = "all"

class CrackHashReq(BaseModel):
    hash_value: str
    hash_type: Optional[str] = "auto"

class EncodeReq(BaseModel):
    text: str
    operation: str  # base64_encode, base64_decode, hex_encode, hex_decode, url_encode, url_decode, rot13, binary, reverse

class JwtReq(BaseModel):
    token: str

class PasswordGenReq(BaseModel):
    length: Optional[int] = 20
    count: Optional[int] = 5
    include_upper: Optional[bool] = True
    include_lower: Optional[bool] = True
    include_digits: Optional[bool] = True
    include_special: Optional[bool] = True

class PasswordCheckReq(BaseModel):
    password: str

class SubnetReq(BaseModel):
    cidr: str

class HeaderReq(BaseModel):
    url: str

class PingReq(BaseModel):
    target: str
    count: Optional[int] = 4

class ReverseIpReq(BaseModel):
    ip: str

# ============================================================================
# REAL PORT SCANNER
# ============================================================================

@tools_router.post("/port-scan")
async def real_port_scan(req: PortScanReq):
    """REAL port scanner - actually connects to ports via TCP"""
    target = req.target.strip()

    # Resolve hostname
    try:
        ip = socket.gethostbyname(target)
    except socket.gaierror:
        raise HTTPException(status_code=400, detail=f"Cannot resolve hostname: {target}")

    ports = [int(p.strip()) for p in req.ports.split(",") if p.strip().isdigit()]
    if not ports:
        raise HTTPException(status_code=400, detail="No valid ports specified")

    results = []
    open_count = 0

    SERVICE_MAP = {
        21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
        80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS", 445: "SMB",
        993: "IMAPS", 995: "POP3S", 3306: "MySQL", 3389: "RDP",
        5432: "PostgreSQL", 6379: "Redis", 8080: "HTTP-Alt", 8443: "HTTPS-Alt",
        27017: "MongoDB", 5900: "VNC", 6667: "IRC", 9200: "Elasticsearch",
        11211: "Memcached", 1433: "MSSQL", 1521: "Oracle",
    }

    async def scan_port(port: int):
        try:
            conn = asyncio.open_connection(ip, port)
            _, writer = await asyncio.wait_for(conn, timeout=req.timeout)
            writer.close()
            await writer.wait_closed()
            return {"port": port, "state": "open", "service": SERVICE_MAP.get(port, "unknown")}
        except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
            return {"port": port, "state": "closed", "service": SERVICE_MAP.get(port, "unknown")}

    tasks = [scan_port(p) for p in ports[:50]]  # Limit to 50 ports
    results = await asyncio.gather(*tasks)
    open_count = sum(1 for r in results if r["state"] == "open")

    return {
        "tool": "Real Port Scanner",
        "target": target,
        "ip": ip,
        "total_scanned": len(results),
        "open": open_count,
        "closed": len(results) - open_count,
        "results": sorted(results, key=lambda x: x["port"]),
        "functional": True,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# REAL DNS LOOKUP
# ============================================================================

@tools_router.post("/dns-lookup")
async def real_dns_lookup(req: DnsReq):
    """REAL DNS resolver - queries actual DNS records"""
    import dns.resolver

    domain = req.domain.strip()
    records = {}
    record_types = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"] if req.record_type == "ALL" else [req.record_type.upper()]

    for rtype in record_types:
        try:
            answers = dns.resolver.resolve(domain, rtype)
            records[rtype] = [str(r) for r in answers]
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.resolver.NoNameservers, Exception):
            pass

    # Also get IP
    try:
        ip = socket.gethostbyname(domain)
        records["RESOLVED_IP"] = [ip]
    except socket.gaierror:
        pass

    # Reverse DNS
    if "RESOLVED_IP" in records:
        try:
            reverse = socket.gethostbyaddr(records["RESOLVED_IP"][0])
            records["REVERSE_DNS"] = [reverse[0]]
        except (socket.herror, socket.gaierror):
            pass

    return {
        "tool": "Real DNS Lookup",
        "domain": domain,
        "records_found": sum(len(v) for v in records.values()),
        "records": records,
        "functional": True,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# REAL WHOIS LOOKUP
# ============================================================================

@tools_router.post("/whois")
async def real_whois_lookup(req: WhoisReq):
    """REAL WHOIS lookup - queries domain registration data"""
    import whois

    domain = req.domain.strip()
    try:
        w = whois.whois(domain)
        result = {
            "domain": w.domain_name,
            "registrar": w.registrar,
            "creation_date": str(w.creation_date) if w.creation_date else None,
            "expiration_date": str(w.expiration_date) if w.expiration_date else None,
            "updated_date": str(w.updated_date) if w.updated_date else None,
            "name_servers": w.name_servers if isinstance(w.name_servers, list) else [w.name_servers] if w.name_servers else [],
            "status": w.status if isinstance(w.status, list) else [w.status] if w.status else [],
            "country": w.country,
            "state": w.state,
            "city": w.city,
            "org": w.org,
            "emails": w.emails if isinstance(w.emails, list) else [w.emails] if w.emails else [],
            "dnssec": w.dnssec,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"WHOIS lookup failed: {str(e)}")

    return {
        "tool": "Real WHOIS Lookup",
        "query": domain,
        "data": result,
        "functional": True,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# REAL HASH GENERATOR
# ============================================================================

@tools_router.post("/hash")
async def generate_hash(req: HashReq):
    """REAL hash computation - computes actual cryptographic hashes"""
    text_bytes = req.text.encode('utf-8')
    hashes = {}

    algorithms = {
        "md5": hashlib.md5,
        "sha1": hashlib.sha1,
        "sha224": hashlib.sha224,
        "sha256": hashlib.sha256,
        "sha384": hashlib.sha384,
        "sha512": hashlib.sha512,
    }

    if req.algorithm == "all":
        for name, func in algorithms.items():
            hashes[name] = func(text_bytes).hexdigest()
    elif req.algorithm in algorithms:
        hashes[req.algorithm] = algorithms[req.algorithm](text_bytes).hexdigest()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown algorithm: {req.algorithm}")

    # Also generate NTLM hash (Windows)
    if req.algorithm == "all":
        hashes["ntlm"] = hashlib.new('md4', req.text.encode('utf-16le')).hexdigest()

    return {
        "tool": "Real Hash Generator",
        "input_text": req.text[:50] + "..." if len(req.text) > 50 else req.text,
        "input_length": len(req.text),
        "hashes": hashes,
        "functional": True,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# REAL HASH CRACKER (Dictionary attack against common passwords)
# ============================================================================

COMMON_PASSWORDS = [
    "password", "123456", "12345678", "qwerty", "abc123", "monkey", "1234567",
    "letmein", "trustno1", "dragon", "baseball", "iloveyou", "master", "sunshine",
    "ashley", "bailey", "shadow", "123123", "654321", "superman", "qazwsx",
    "michael", "football", "password1", "password123", "admin", "admin123",
    "root", "toor", "test", "guest", "info", "welcome", "hello", "charlie",
    "donald", "loveme", "hockey", "ranger", "soccer", "thomas", "login",
    "access", "love", "hunter", "pepper", "daniel", "joshua", "maggie",
    "starwars", "silver", "william", "dallas", "yankees", "jordan", "george",
    "andrea", "matrix", "whatever", "cheese", "121212", "zaq1zaq1", "passwd",
    "000000", "111111", "222222", "333333", "444444", "555555", "666666",
    "777777", "888888", "999999", "1234", "12345", "123456789", "1234567890",
]

@tools_router.post("/crack-hash")
async def crack_hash(req: CrackHashReq):
    """REAL hash cracker - dictionary attack against common passwords"""
    target_hash = req.hash_value.lower().strip()

    # Detect hash type by length
    hash_funcs = []
    if req.hash_type == "auto":
        if len(target_hash) == 32:
            hash_funcs = [("md5", hashlib.md5)]
        elif len(target_hash) == 40:
            hash_funcs = [("sha1", hashlib.sha1)]
        elif len(target_hash) == 64:
            hash_funcs = [("sha256", hashlib.sha256)]
        elif len(target_hash) == 128:
            hash_funcs = [("sha512", hashlib.sha512)]
        else:
            hash_funcs = [("md5", hashlib.md5), ("sha1", hashlib.sha1), ("sha256", hashlib.sha256)]
    else:
        algos = {"md5": hashlib.md5, "sha1": hashlib.sha1, "sha256": hashlib.sha256, "sha512": hashlib.sha512}
        if req.hash_type in algos:
            hash_funcs = [(req.hash_type, algos[req.hash_type])]

    found = False
    cracked_password = None
    attempts = 0
    detected_type = None

    for name, func in hash_funcs:
        for pwd in COMMON_PASSWORDS:
            attempts += 1
            if func(pwd.encode()).hexdigest() == target_hash:
                found = True
                cracked_password = pwd
                detected_type = name
                break
            # Also try variations
            for variation in [pwd.upper(), pwd.capitalize(), pwd + "1", pwd + "123", pwd + "!"]:
                attempts += 1
                if func(variation.encode()).hexdigest() == target_hash:
                    found = True
                    cracked_password = variation
                    detected_type = name
                    break
            if found:
                break
        if found:
            break

    return {
        "tool": "Real Hash Cracker",
        "hash": target_hash[:20] + "...",
        "hash_length": len(target_hash),
        "detected_type": detected_type,
        "cracked": found,
        "password": cracked_password,
        "attempts": attempts,
        "dictionary_size": len(COMMON_PASSWORDS),
        "functional": True,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# REAL ENCODER/DECODER
# ============================================================================

@tools_router.post("/encode")
async def encode_decode(req: EncodeReq):
    """REAL encoder/decoder - Base64, Hex, URL, ROT13, Binary, Reverse"""
    result = ""
    try:
        if req.operation == "base64_encode":
            result = base64.b64encode(req.text.encode()).decode()
        elif req.operation == "base64_decode":
            result = base64.b64decode(req.text).decode()
        elif req.operation == "hex_encode":
            result = req.text.encode().hex()
        elif req.operation == "hex_decode":
            result = bytes.fromhex(req.text).decode()
        elif req.operation == "url_encode":
            from urllib.parse import quote
            result = quote(req.text, safe='')
        elif req.operation == "url_decode":
            from urllib.parse import unquote
            result = unquote(req.text)
        elif req.operation == "rot13":
            result = req.text.translate(str.maketrans(
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
                'NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm'))
        elif req.operation == "binary":
            result = ' '.join(format(ord(c), '08b') for c in req.text)
        elif req.operation == "binary_decode":
            bits = req.text.replace(' ', '')
            result = ''.join(chr(int(bits[i:i+8], 2)) for i in range(0, len(bits), 8))
        elif req.operation == "reverse":
            result = req.text[::-1]
        elif req.operation == "morse_encode":
            MORSE = {'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', ' ': '/'}
            result = ' '.join(MORSE.get(c.upper(), '?') for c in req.text)
        elif req.operation == "ascii":
            result = ' '.join(str(ord(c)) for c in req.text)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown operation: {req.operation}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

    return {
        "tool": "Real Encoder/Decoder",
        "operation": req.operation,
        "input": req.text[:100],
        "output": result[:2000],
        "input_length": len(req.text),
        "output_length": len(result),
        "functional": True,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# REAL JWT DECODER
# ============================================================================

@tools_router.post("/jwt-decode")
async def jwt_decode(req: JwtReq):
    """REAL JWT decoder - decodes actual JWT tokens"""
    token = req.token.strip()
    parts = token.split('.')

    if len(parts) != 3:
        raise HTTPException(status_code=400, detail="Invalid JWT format (expected 3 parts)")

    def decode_part(part):
        padding = 4 - len(part) % 4
        part += "=" * padding
        try:
            return json.loads(base64.urlsafe_b64decode(part))
        except Exception:
            return None

    header = decode_part(parts[0])
    payload = decode_part(parts[1])

    # Check expiration
    expired = False
    exp_date = None
    if payload and "exp" in payload:
        from datetime import timezone
        exp_ts = payload["exp"]
        exp_date = datetime.fromtimestamp(exp_ts, tz=timezone.utc).isoformat()
        expired = datetime.now(timezone.utc).timestamp() > exp_ts

    return {
        "tool": "Real JWT Decoder",
        "header": header,
        "payload": payload,
        "signature": parts[2][:20] + "...",
        "algorithm": header.get("alg", "unknown") if header else "unknown",
        "expired": expired,
        "expiration_date": exp_date,
        "claims_count": len(payload) if payload else 0,
        "functional": True,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# REAL PASSWORD GENERATOR
# ============================================================================

@tools_router.post("/password-gen")
async def generate_passwords(req: PasswordGenReq):
    """REAL cryptographic password generator"""
    charset = ""
    if req.include_upper:
        charset += string.ascii_uppercase
    if req.include_lower:
        charset += string.ascii_lowercase
    if req.include_digits:
        charset += string.digits
    if req.include_special:
        charset += "!@#$%^&*()_+-=[]{}|;:,.<>?"

    if not charset:
        charset = string.ascii_letters + string.digits

    length = max(4, min(req.length, 128))
    count = max(1, min(req.count, 20))

    passwords = []
    for _ in range(count):
        pwd = ''.join(secrets.choice(charset) for _ in range(length))
        # Calculate entropy
        entropy = length * (len(charset)).bit_length()
        passwords.append({
            "password": pwd,
            "length": length,
            "entropy_bits": entropy,
            "strength": "VERY STRONG" if entropy > 100 else "STRONG" if entropy > 60 else "MEDIUM" if entropy > 40 else "WEAK"
        })

    return {
        "tool": "Real Password Generator",
        "charset_size": len(charset),
        "passwords": passwords,
        "functional": True,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# REAL PASSWORD STRENGTH ANALYZER
# ============================================================================

@tools_router.post("/password-check")
async def check_password_strength(req: PasswordCheckReq):
    """REAL password strength analysis"""
    pwd = req.password
    score = 0
    feedback = []

    # Length
    if len(pwd) >= 8: score += 1
    if len(pwd) >= 12: score += 1
    if len(pwd) >= 16: score += 2
    if len(pwd) < 8: feedback.append("Muy corta (minimo 8 caracteres)")

    # Character types
    has_upper = bool(re.search(r'[A-Z]', pwd))
    has_lower = bool(re.search(r'[a-z]', pwd))
    has_digit = bool(re.search(r'\d', pwd))
    has_special = bool(re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', pwd))

    if has_upper: score += 1
    else: feedback.append("Agregar mayusculas")
    if has_lower: score += 1
    else: feedback.append("Agregar minusculas")
    if has_digit: score += 1
    else: feedback.append("Agregar numeros")
    if has_special: score += 2
    else: feedback.append("Agregar caracteres especiales")

    # Patterns (penalties)
    if re.search(r'(.)\1{2,}', pwd): score -= 1; feedback.append("Caracteres repetidos detectados")
    if re.search(r'(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)', pwd.lower()): score -= 1; feedback.append("Secuencia detectada")

    # Check against common passwords
    is_common = pwd.lower() in [p.lower() for p in COMMON_PASSWORDS]
    if is_common: score = 0; feedback.append("CONTRASENA COMUN - Cambiar inmediatamente")

    # Entropy
    charset_size = 0
    if has_upper: charset_size += 26
    if has_lower: charset_size += 26
    if has_digit: charset_size += 10
    if has_special: charset_size += 30
    entropy = len(pwd) * (charset_size.bit_length() if charset_size > 0 else 0)

    # Crack time estimate
    if entropy < 30: crack_time = "Instantaneo"
    elif entropy < 40: crack_time = "Minutos"
    elif entropy < 50: crack_time = "Horas"
    elif entropy < 60: crack_time = "Dias"
    elif entropy < 70: crack_time = "Meses"
    elif entropy < 80: crack_time = "Anos"
    else: crack_time = "Siglos"

    score = max(0, min(score, 10))
    if score >= 8: strength = "MUY FUERTE"
    elif score >= 6: strength = "FUERTE"
    elif score >= 4: strength = "MEDIA"
    elif score >= 2: strength = "DEBIL"
    else: strength = "MUY DEBIL"

    return {
        "tool": "Real Password Analyzer",
        "length": len(pwd),
        "score": score,
        "max_score": 10,
        "strength": strength,
        "entropy_bits": entropy,
        "crack_time_estimate": crack_time,
        "is_common": is_common,
        "has_uppercase": has_upper,
        "has_lowercase": has_lower,
        "has_digits": has_digit,
        "has_special": has_special,
        "feedback": feedback if feedback else ["Excelente contrasena!"],
        "functional": True,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# REAL SUBNET CALCULATOR
# ============================================================================

@tools_router.post("/subnet")
async def subnet_calc(req: SubnetReq):
    """REAL subnet calculator - computes actual network math"""
    try:
        network = ipaddress.ip_network(req.cidr, strict=False)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid CIDR: {str(e)}")

    return {
        "tool": "Real Subnet Calculator",
        "input": req.cidr,
        "network_address": str(network.network_address),
        "broadcast_address": str(network.broadcast_address),
        "netmask": str(network.netmask),
        "hostmask": str(network.hostmask),
        "prefix_length": network.prefixlen,
        "total_hosts": network.num_addresses,
        "usable_hosts": max(0, network.num_addresses - 2),
        "first_host": str(list(network.hosts())[0]) if network.num_addresses > 2 else str(network.network_address),
        "last_host": str(list(network.hosts())[-1]) if network.num_addresses > 2 else str(network.network_address),
        "is_private": network.is_private,
        "version": network.version,
        "functional": True,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# REAL HTTP HEADER INSPECTOR
# ============================================================================

@tools_router.post("/http-headers")
async def inspect_headers(req: HeaderReq):
    """REAL HTTP header inspector - fetches actual headers from URLs"""
    import httpx

    url = req.url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.head(url)

        headers = dict(response.headers)
        security_headers = {
            "X-Frame-Options": headers.get("x-frame-options", "MISSING"),
            "X-Content-Type-Options": headers.get("x-content-type-options", "MISSING"),
            "Strict-Transport-Security": headers.get("strict-transport-security", "MISSING"),
            "Content-Security-Policy": headers.get("content-security-policy", "MISSING")[:100] if headers.get("content-security-policy") else "MISSING",
            "X-XSS-Protection": headers.get("x-xss-protection", "MISSING"),
            "Referrer-Policy": headers.get("referrer-policy", "MISSING"),
        }
        missing_security = sum(1 for v in security_headers.values() if v == "MISSING")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"HTTP request failed: {str(e)}")

    return {
        "tool": "Real HTTP Header Inspector",
        "url": url,
        "status_code": response.status_code,
        "server": headers.get("server", "unknown"),
        "content_type": headers.get("content-type", "unknown"),
        "all_headers": headers,
        "security_headers": security_headers,
        "missing_security_headers": missing_security,
        "security_grade": "A" if missing_security == 0 else "B" if missing_security <= 2 else "C" if missing_security <= 4 else "F",
        "functional": True,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# REAL PING (TCP connect check)
# ============================================================================

@tools_router.post("/ping")
async def tcp_ping(req: PingReq):
    """REAL TCP ping - tests actual connectivity"""
    target = req.target.strip()

    try:
        ip = socket.gethostbyname(target)
    except socket.gaierror:
        raise HTTPException(status_code=400, detail=f"Cannot resolve: {target}")

    results = []
    for i in range(min(req.count, 10)):
        start = asyncio.get_event_loop().time()
        try:
            conn = asyncio.open_connection(ip, 80)
            _, writer = await asyncio.wait_for(conn, timeout=3)
            elapsed = (asyncio.get_event_loop().time() - start) * 1000
            writer.close()
            await writer.wait_closed()
            results.append({"seq": i + 1, "time_ms": round(elapsed, 2), "status": "ok"})
        except Exception:
            elapsed = (asyncio.get_event_loop().time() - start) * 1000
            results.append({"seq": i + 1, "time_ms": round(elapsed, 2), "status": "timeout"})

    success = [r for r in results if r["status"] == "ok"]
    times = [r["time_ms"] for r in success]

    return {
        "tool": "Real TCP Ping",
        "target": target,
        "ip": ip,
        "packets_sent": len(results),
        "packets_received": len(success),
        "packet_loss": f"{round((1 - len(success)/len(results)) * 100)}%",
        "min_ms": round(min(times), 2) if times else 0,
        "avg_ms": round(sum(times)/len(times), 2) if times else 0,
        "max_ms": round(max(times), 2) if times else 0,
        "results": results,
        "functional": True,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# REVERSE IP LOOKUP
# ============================================================================

@tools_router.post("/reverse-ip")
async def reverse_ip(req: ReverseIpReq):
    """REAL reverse IP lookup"""
    try:
        ip = req.ip.strip()
        hostname, aliases, addrs = socket.gethostbyaddr(ip)
        return {
            "tool": "Real Reverse IP Lookup",
            "ip": ip,
            "hostname": hostname,
            "aliases": aliases,
            "addresses": addrs,
            "functional": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    except socket.herror:
        return {
            "tool": "Real Reverse IP Lookup",
            "ip": req.ip,
            "hostname": "No reverse DNS found",
            "aliases": [],
            "addresses": [req.ip],
            "functional": True,
            "timestamp": datetime.utcnow().isoformat()
        }

# ============================================================================
# TOOLS DASHBOARD
# ============================================================================

@tools_router.get("/dashboard")
async def tools_dashboard():
    """List all available functional cyber tools"""
    return {
        "module": "Cyber Tools - X=pi by Carbi",
        "description": "Herramientas FUNCIONALES que ejecutan operaciones reales",
        "total_tools": 14,
        "tools": [
            {"name": "Port Scanner", "endpoint": "POST /api/tools/port-scan", "description": "Escaneo REAL de puertos TCP", "type": "network"},
            {"name": "DNS Lookup", "endpoint": "POST /api/tools/dns-lookup", "description": "Consulta REAL de registros DNS", "type": "network"},
            {"name": "WHOIS", "endpoint": "POST /api/tools/whois", "description": "Consulta REAL de datos WHOIS", "type": "network"},
            {"name": "TCP Ping", "endpoint": "POST /api/tools/ping", "description": "Ping REAL via TCP connect", "type": "network"},
            {"name": "Reverse IP", "endpoint": "POST /api/tools/reverse-ip", "description": "Reverse DNS REAL", "type": "network"},
            {"name": "HTTP Headers", "endpoint": "POST /api/tools/http-headers", "description": "Inspector REAL de headers HTTP", "type": "web"},
            {"name": "Hash Generator", "endpoint": "POST /api/tools/hash", "description": "Genera hashes MD5/SHA/NTLM reales", "type": "crypto"},
            {"name": "Hash Cracker", "endpoint": "POST /api/tools/crack-hash", "description": "Ataque diccionario contra hashes", "type": "crypto"},
            {"name": "Encoder/Decoder", "endpoint": "POST /api/tools/encode", "description": "Base64/Hex/URL/ROT13/Binary/Morse", "type": "crypto"},
            {"name": "JWT Decoder", "endpoint": "POST /api/tools/jwt-decode", "description": "Decodifica tokens JWT reales", "type": "crypto"},
            {"name": "Password Generator", "endpoint": "POST /api/tools/password-gen", "description": "Genera contrasenas criptograficas", "type": "password"},
            {"name": "Password Analyzer", "endpoint": "POST /api/tools/password-check", "description": "Analiza fuerza de contrasenas", "type": "password"},
            {"name": "Subnet Calculator", "endpoint": "POST /api/tools/subnet", "description": "Calculadora de subredes IP", "type": "network"},
        ],
        "all_functional": True,
        "timestamp": datetime.utcnow().isoformat()
    }
