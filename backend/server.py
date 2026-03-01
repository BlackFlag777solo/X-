from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import httpx
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="X=π by Carbi", description="Cybersecurity Toolkit")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ Models ============

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # user or assistant
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

class OSINTRequest(BaseModel):
    username: str

class OSINTResult(BaseModel):
    platform: str
    url: str
    exists: bool
    status: str

class PasswordCheckRequest(BaseModel):
    password: str

class PasswordCheckResult(BaseModel):
    is_pwned: bool
    breach_count: int
    strength: str
    suggestions: List[str]

class WebsiteAnalysisRequest(BaseModel):
    url: str

class SecurityHeader(BaseModel):
    header: str
    present: bool
    value: Optional[str] = None
    risk_level: str

class WebsiteAnalysisResult(BaseModel):
    url: str
    status_code: int
    headers: List[SecurityHeader]
    overall_score: str
    recommendations: List[str]

class ScanHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    scan_type: str
    target: str
    result_summary: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ============ Security Intelligence Center Models ============

class CVERequest(BaseModel):
    cve_id: str

class CVEInfo(BaseModel):
    cve_id: str
    description: str
    severity: str
    cvss_score: Optional[float] = None
    published_date: Optional[str] = None
    references: List[str]
    affected_products: List[str]
    exploits_available: bool

class TechDetectRequest(BaseModel):
    url: str

class DetectedTechnology(BaseModel):
    name: str
    category: str
    version: Optional[str] = None
    confidence: str

class TechDetectResult(BaseModel):
    url: str
    technologies: List[DetectedTechnology]
    server: Optional[str] = None
    powered_by: Optional[str] = None
    cms: Optional[str] = None
    framework: Optional[str] = None

class DDoSAnalysisRequest(BaseModel):
    url: str

class DDoSVulnerability(BaseModel):
    type: str
    risk_level: str
    description: str
    mitigation: str

class DDoSAnalysisResult(BaseModel):
    url: str
    overall_risk: str
    vulnerabilities: List[DDoSVulnerability]
    recommendations: List[str]
    protection_detected: bool
    cdn_detected: Optional[str] = None

class SecurityReportRequest(BaseModel):
    target: str
    findings: List[str]
    severity: str
    report_type: str  # bug_bounty, pentest, assessment

class SecurityReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    target: str
    report_type: str
    severity: str
    findings: List[str]
    executive_summary: str
    technical_details: str
    recommendations: List[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ============ Helper Functions ============

SOCIAL_PLATFORMS = [
    {"name": "GitHub", "url": "https://github.com/{}", "check_url": "https://api.github.com/users/{}"},
    {"name": "Twitter/X", "url": "https://twitter.com/{}", "check_url": "https://twitter.com/{}"},
    {"name": "Instagram", "url": "https://instagram.com/{}", "check_url": "https://www.instagram.com/{}/"},
    {"name": "Reddit", "url": "https://reddit.com/user/{}", "check_url": "https://www.reddit.com/user/{}/about.json"},
    {"name": "LinkedIn", "url": "https://linkedin.com/in/{}", "check_url": "https://www.linkedin.com/in/{}/"},
    {"name": "TikTok", "url": "https://tiktok.com/@{}", "check_url": "https://www.tiktok.com/@{}"},
    {"name": "YouTube", "url": "https://youtube.com/@{}", "check_url": "https://www.youtube.com/@{}"},
    {"name": "Pinterest", "url": "https://pinterest.com/{}", "check_url": "https://www.pinterest.com/{}/"},
    {"name": "Twitch", "url": "https://twitch.tv/{}", "check_url": "https://www.twitch.tv/{}"},
    {"name": "Medium", "url": "https://medium.com/@{}", "check_url": "https://medium.com/@{}"},
]

async def check_platform(client: httpx.AsyncClient, platform: dict, username: str) -> OSINTResult:
    try:
        url = platform["check_url"].format(username)
        response = await client.get(url, timeout=10.0, follow_redirects=True)
        
        # Different platforms have different ways to detect if user exists
        exists = False
        if platform["name"] == "GitHub":
            exists = response.status_code == 200
        elif platform["name"] == "Reddit":
            exists = response.status_code == 200 and '"error"' not in response.text
        else:
            exists = response.status_code == 200 and "not found" not in response.text.lower()
        
        return OSINTResult(
            platform=platform["name"],
            url=platform["url"].format(username),
            exists=exists,
            status="found" if exists else "not found"
        )
    except Exception as e:
        return OSINTResult(
            platform=platform["name"],
            url=platform["url"].format(username),
            exists=False,
            status=f"error: timeout"
        )

def calculate_password_strength(password: str) -> tuple:
    """Calculate password strength and provide suggestions"""
    suggestions = []
    score = 0
    
    if len(password) >= 8:
        score += 1
    else:
        suggestions.append("Use at least 8 characters")
    
    if len(password) >= 12:
        score += 1
    else:
        suggestions.append("Use at least 12 characters for better security")
    
    if any(c.isupper() for c in password):
        score += 1
    else:
        suggestions.append("Add uppercase letters")
    
    if any(c.islower() for c in password):
        score += 1
    else:
        suggestions.append("Add lowercase letters")
    
    if any(c.isdigit() for c in password):
        score += 1
    else:
        suggestions.append("Add numbers")
    
    if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        score += 1
    else:
        suggestions.append("Add special characters (!@#$%^&*)")
    
    if score <= 2:
        strength = "Weak"
    elif score <= 4:
        strength = "Medium"
    else:
        strength = "Strong"
    
    return strength, suggestions

import hashlib

async def check_hibp(password: str) -> tuple:
    """Check Have I Been Pwned API"""
    sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    prefix = sha1_hash[:5]
    suffix = sha1_hash[5:]
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.pwnedpasswords.com/range/{prefix}",
                timeout=10.0
            )
            if response.status_code == 200:
                hashes = response.text.split('\n')
                for h in hashes:
                    parts = h.strip().split(':')
                    if len(parts) == 2 and parts[0] == suffix:
                        return True, int(parts[1])
            return False, 0
    except:
        return False, 0

SECURITY_HEADERS = [
    "Strict-Transport-Security",
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "X-XSS-Protection",
    "Referrer-Policy",
    "Permissions-Policy",
]

# ============ Routes ============

@api_router.get("/")
async def root():
    return {"message": "X=π by Carbi - Cybersecurity Toolkit", "version": "1.0.0"}

# OSINT Scanner
@api_router.post("/osint/scan", response_model=List[OSINTResult])
async def osint_scan(request: OSINTRequest):
    """Scan multiple platforms for a username"""
    username = request.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    
    results = []
    async with httpx.AsyncClient(headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}) as client:
        tasks = [check_platform(client, platform, username) for platform in SOCIAL_PLATFORMS]
        results = await asyncio.gather(*tasks)
    
    # Save to history
    found_count = sum(1 for r in results if r.exists)
    history = ScanHistory(
        scan_type="OSINT",
        target=username,
        result_summary=f"Found on {found_count}/{len(results)} platforms"
    )
    await db.scan_history.insert_one(history.dict())
    
    return results

# Password Checker
@api_router.post("/password/check", response_model=PasswordCheckResult)
async def check_password(request: PasswordCheckRequest):
    """Check password strength and if it's been pwned"""
    password = request.password
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")
    
    is_pwned, breach_count = await check_hibp(password)
    strength, suggestions = calculate_password_strength(password)
    
    if is_pwned:
        suggestions.insert(0, f"⚠️ This password was found in {breach_count:,} data breaches!")
    
    # Save to history (don't save the actual password!)
    history = ScanHistory(
        scan_type="Password Check",
        target="[REDACTED]",
        result_summary=f"Strength: {strength}, Pwned: {is_pwned}"
    )
    await db.scan_history.insert_one(history.dict())
    
    return PasswordCheckResult(
        is_pwned=is_pwned,
        breach_count=breach_count,
        strength=strength,
        suggestions=suggestions
    )

# Website Security Analyzer
@api_router.post("/website/analyze", response_model=WebsiteAnalysisResult)
async def analyze_website(request: WebsiteAnalysisRequest):
    """Analyze website security headers"""
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    if not url.startswith("http"):
        url = "https://" + url
    
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            
            headers_result = []
            missing_count = 0
            
            for header in SECURITY_HEADERS:
                value = response.headers.get(header)
                present = value is not None
                if not present:
                    missing_count += 1
                
                risk_level = "low" if present else "high"
                if header in ["X-XSS-Protection"]:
                    risk_level = "medium" if not present else "low"
                
                headers_result.append(SecurityHeader(
                    header=header,
                    present=present,
                    value=value[:100] if value else None,
                    risk_level=risk_level
                ))
            
            # Calculate score
            if missing_count == 0:
                score = "A+ (Excellent)"
            elif missing_count <= 2:
                score = "B (Good)"
            elif missing_count <= 4:
                score = "C (Fair)"
            else:
                score = "D (Poor)"
            
            recommendations = []
            for h in headers_result:
                if not h.present:
                    recommendations.append(f"Add {h.header} header")
            
            # Save to history
            history = ScanHistory(
                scan_type="Website Analysis",
                target=url,
                result_summary=f"Score: {score}, Missing headers: {missing_count}"
            )
            await db.scan_history.insert_one(history.dict())
            
            return WebsiteAnalysisResult(
                url=url,
                status_code=response.status_code,
                headers=headers_result,
                overall_score=score,
                recommendations=recommendations
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not analyze website: {str(e)}")

# AI Security Chat
@api_router.post("/chat", response_model=ChatResponse)
async def security_chat(request: ChatRequest):
    """Chat with AI about cybersecurity"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    try:
        # Get chat history
        history = await db.chat_messages.find(
            {"session_id": request.session_id}
        ).sort("timestamp", 1).to_list(50)
        
        # Build system message
        system_message = """You are X=π (X equals Pi), an advanced AI cybersecurity assistant created by Carbi.
You are an expert in:
- OSINT (Open Source Intelligence)
- Password security and best practices
- Website security analysis
- Network security fundamentals
- Ethical hacking concepts
- Privacy protection
- Malware analysis basics
- Social engineering awareness

You help users understand cybersecurity concepts and protect themselves online.
Always promote ethical and legal security practices.
Be concise but informative. Use technical terms when appropriate.
Sign your responses as: - X=π by Carbi"""
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=request.session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        # Add history context
        context = ""
        if history:
            context = "Previous conversation:\n"
            for msg in history[-10:]:
                role = "User" if msg["role"] == "user" else "Assistant"
                context += f"{role}: {msg['content']}\n"
            context += "\nCurrent question:\n"
        
        user_message = UserMessage(text=context + request.message)
        response = await chat.send_message(user_message)
        
        # Save messages to database
        user_msg = ChatMessage(
            session_id=request.session_id,
            role="user",
            content=request.message
        )
        assistant_msg = ChatMessage(
            session_id=request.session_id,
            role="assistant",
            content=response
        )
        
        await db.chat_messages.insert_one(user_msg.dict())
        await db.chat_messages.insert_one(assistant_msg.dict())
        
        return ChatResponse(response=response, session_id=request.session_id)
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

# Get scan history
@api_router.get("/history", response_model=List[ScanHistory])
async def get_scan_history():
    """Get recent scan history"""
    history = await db.scan_history.find().sort("timestamp", -1).to_list(50)
    return [ScanHistory(**h) for h in history]

# Clear chat history
@api_router.delete("/chat/{session_id}")
async def clear_chat_history(session_id: str):
    """Clear chat history for a session"""
    await db.chat_messages.delete_many({"session_id": session_id})
    return {"message": "Chat history cleared"}

# ============ Security Intelligence Center Routes ============

# Technology fingerprints for detection
TECH_SIGNATURES = {
    "WordPress": {"headers": ["x-powered-by"], "patterns": ["wp-content", "wp-includes", "wordpress"]},
    "React": {"patterns": ["react", "_reactRoot", "data-reactroot"]},
    "Vue.js": {"patterns": ["vue", "__vue__", "data-v-"]},
    "Angular": {"patterns": ["ng-", "angular", "ng-app"]},
    "Django": {"headers": ["x-frame-options"], "patterns": ["csrfmiddlewaretoken", "django"]},
    "Laravel": {"patterns": ["laravel", "csrf-token"], "cookies": ["laravel_session"]},
    "Express.js": {"headers": ["x-powered-by"], "patterns": ["express"]},
    "Nginx": {"headers": ["server"], "patterns": ["nginx"]},
    "Apache": {"headers": ["server"], "patterns": ["apache"]},
    "Cloudflare": {"headers": ["cf-ray", "cf-cache-status"], "patterns": ["cloudflare"]},
    "AWS": {"headers": ["x-amz-"], "patterns": ["amazonaws", "aws"]},
    "jQuery": {"patterns": ["jquery", "$.ajax"]},
    "Bootstrap": {"patterns": ["bootstrap", "btn-primary", "container-fluid"]},
    "Tailwind": {"patterns": ["tailwind", "tw-"]},
}

# CVE Intelligence
@api_router.post("/intel/cve", response_model=CVEInfo)
async def get_cve_info(request: CVERequest):
    """Get detailed CVE information"""
    cve_id = request.cve_id.upper().strip()
    
    if not cve_id.startswith("CVE-"):
        raise HTTPException(status_code=400, detail="Invalid CVE format. Use CVE-YYYY-NNNNN")
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Use NVD API
            response = await client.get(
                f"https://services.nvd.nist.gov/rest/json/cves/2.0?cveId={cve_id}",
                headers={"User-Agent": "XPi Security Scanner"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail=f"CVE {cve_id} not found")
            
            data = response.json()
            
            if not data.get("vulnerabilities"):
                raise HTTPException(status_code=404, detail=f"CVE {cve_id} not found")
            
            vuln = data["vulnerabilities"][0]["cve"]
            
            # Extract description
            descriptions = vuln.get("descriptions", [])
            description = next((d["value"] for d in descriptions if d["lang"] == "en"), "No description available")
            
            # Extract CVSS score
            metrics = vuln.get("metrics", {})
            cvss_score = None
            severity = "Unknown"
            
            if "cvssMetricV31" in metrics:
                cvss_data = metrics["cvssMetricV31"][0]["cvssData"]
                cvss_score = cvss_data.get("baseScore")
                severity = cvss_data.get("baseSeverity", "Unknown")
            elif "cvssMetricV2" in metrics:
                cvss_data = metrics["cvssMetricV2"][0]["cvssData"]
                cvss_score = cvss_data.get("baseScore")
                severity = "HIGH" if cvss_score and cvss_score >= 7.0 else "MEDIUM" if cvss_score and cvss_score >= 4.0 else "LOW"
            
            # Extract references
            references = [ref.get("url", "") for ref in vuln.get("references", [])[:10]]
            
            # Extract affected products
            affected = []
            for config in vuln.get("configurations", []):
                for node in config.get("nodes", []):
                    for cpe in node.get("cpeMatch", []):
                        if cpe.get("vulnerable"):
                            criteria = cpe.get("criteria", "")
                            parts = criteria.split(":")
                            if len(parts) >= 5:
                                affected.append(f"{parts[3]} {parts[4]}")
            
            # Check if exploits are available (simplified check)
            exploits_available = any("exploit" in ref.lower() for ref in references)
            
            # Save to history
            history = ScanHistory(
                scan_type="CVE Lookup",
                target=cve_id,
                result_summary=f"Severity: {severity}, CVSS: {cvss_score}"
            )
            await db.scan_history.insert_one(history.dict())
            
            return CVEInfo(
                cve_id=cve_id,
                description=description[:500],
                severity=severity,
                cvss_score=cvss_score,
                published_date=vuln.get("published", "Unknown"),
                references=references[:5],
                affected_products=affected[:10],
                exploits_available=exploits_available
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching CVE: {str(e)}")

# Technology Detection
@api_router.post("/intel/techdetect", response_model=TechDetectResult)
async def detect_technologies(request: TechDetectRequest):
    """Detect technologies used by a website"""
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    if not url.startswith("http"):
        url = "https://" + url
    
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
            
            html = response.text.lower()
            headers = {k.lower(): v.lower() for k, v in response.headers.items()}
            
            technologies = []
            
            # Check server
            server = headers.get("server", None)
            powered_by = headers.get("x-powered-by", None)
            
            # Detect technologies
            for tech_name, signatures in TECH_SIGNATURES.items():
                detected = False
                confidence = "low"
                version = None
                
                # Check headers
                if "headers" in signatures:
                    for header in signatures["headers"]:
                        if header in headers:
                            if tech_name.lower() in headers[header]:
                                detected = True
                                confidence = "high"
                
                # Check patterns in HTML
                if "patterns" in signatures:
                    matches = sum(1 for pattern in signatures["patterns"] if pattern in html)
                    if matches >= 2:
                        detected = True
                        confidence = "high"
                    elif matches == 1:
                        detected = True
                        confidence = "medium"
                
                if detected:
                    category = "Server" if tech_name in ["Nginx", "Apache"] else \
                               "CDN" if tech_name == "Cloudflare" else \
                               "Cloud" if tech_name == "AWS" else \
                               "CMS" if tech_name == "WordPress" else \
                               "Framework"
                    
                    technologies.append(DetectedTechnology(
                        name=tech_name,
                        category=category,
                        version=version,
                        confidence=confidence
                    ))
            
            # Detect CMS
            cms = None
            if "wordpress" in html or "wp-content" in html:
                cms = "WordPress"
            elif "drupal" in html:
                cms = "Drupal"
            elif "joomla" in html:
                cms = "Joomla"
            elif "shopify" in html:
                cms = "Shopify"
            
            # Detect framework
            framework = None
            if "react" in html or "_reactroot" in html:
                framework = "React"
            elif "vue" in html or "__vue__" in html:
                framework = "Vue.js"
            elif "angular" in html or "ng-" in html:
                framework = "Angular"
            
            # Save to history
            history = ScanHistory(
                scan_type="Tech Detection",
                target=url,
                result_summary=f"Found {len(technologies)} technologies"
            )
            await db.scan_history.insert_one(history.dict())
            
            return TechDetectResult(
                url=url,
                technologies=technologies,
                server=server,
                powered_by=powered_by,
                cms=cms,
                framework=framework
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not analyze: {str(e)}")

# DDoS Defense Analysis
@api_router.post("/intel/ddos-analysis", response_model=DDoSAnalysisResult)
async def analyze_ddos_defense(request: DDoSAnalysisRequest):
    """Analyze DDoS protection and vulnerabilities (DEFENSIVE)"""
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    if not url.startswith("http"):
        url = "https://" + url
    
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            
            headers = {k.lower(): v for k, v in response.headers.items()}
            
            vulnerabilities = []
            recommendations = []
            
            # Check for CDN/DDoS protection
            cdn_detected = None
            protection_detected = False
            
            if "cf-ray" in headers or "cf-cache-status" in headers:
                cdn_detected = "Cloudflare"
                protection_detected = True
            elif "x-akamai" in str(headers) or "akamai" in str(headers):
                cdn_detected = "Akamai"
                protection_detected = True
            elif "x-amz-cf" in str(headers):
                cdn_detected = "AWS CloudFront"
                protection_detected = True
            elif "x-fastly" in str(headers):
                cdn_detected = "Fastly"
                protection_detected = True
            
            # Check rate limiting headers
            if not any(h in headers for h in ["x-ratelimit-limit", "ratelimit-limit", "retry-after"]):
                vulnerabilities.append(DDoSVulnerability(
                    type="No Rate Limiting",
                    risk_level="HIGH",
                    description="No rate limiting headers detected. Server may be vulnerable to request floods.",
                    mitigation="Implement rate limiting at application or infrastructure level"
                ))
                recommendations.append("Implement rate limiting (X-RateLimit headers)")
            
            # Check for no CDN
            if not protection_detected:
                vulnerabilities.append(DDoSVulnerability(
                    type="No CDN Protection",
                    risk_level="HIGH",
                    description="No CDN/DDoS protection service detected. Direct attacks possible.",
                    mitigation="Deploy behind a CDN like Cloudflare, AWS CloudFront, or Akamai"
                ))
                recommendations.append("Deploy behind a CDN with DDoS protection")
            
            # Check cache headers
            if "cache-control" not in headers:
                vulnerabilities.append(DDoSVulnerability(
                    type="No Caching",
                    risk_level="MEDIUM",
                    description="No cache-control headers. Each request hits origin server.",
                    mitigation="Implement proper caching headers to reduce origin load"
                ))
                recommendations.append("Add Cache-Control headers")
            
            # Check connection limits
            if "keep-alive" not in headers.get("connection", "").lower():
                vulnerabilities.append(DDoSVulnerability(
                    type="Connection Management",
                    risk_level="LOW",
                    description="Connection handling could be optimized.",
                    mitigation="Enable HTTP Keep-Alive for connection reuse"
                ))
            
            # Calculate overall risk
            high_count = sum(1 for v in vulnerabilities if v.risk_level == "HIGH")
            if high_count >= 2:
                overall_risk = "CRITICAL"
            elif high_count == 1:
                overall_risk = "HIGH"
            elif len(vulnerabilities) > 0:
                overall_risk = "MEDIUM"
            else:
                overall_risk = "LOW"
            
            # Add general recommendations
            if not recommendations:
                recommendations.append("Good baseline protection detected")
            
            recommendations.extend([
                "Monitor traffic patterns for anomalies",
                "Have an incident response plan ready",
                "Consider geographic rate limiting"
            ])
            
            # Save to history
            history = ScanHistory(
                scan_type="DDoS Analysis",
                target=url,
                result_summary=f"Risk: {overall_risk}, Vulnerabilities: {len(vulnerabilities)}"
            )
            await db.scan_history.insert_one(history.dict())
            
            return DDoSAnalysisResult(
                url=url,
                overall_risk=overall_risk,
                vulnerabilities=vulnerabilities,
                recommendations=recommendations[:6],
                protection_detected=protection_detected,
                cdn_detected=cdn_detected
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Analysis failed: {str(e)}")

# Security Report Generator
@api_router.post("/intel/report", response_model=SecurityReport)
async def generate_security_report(request: SecurityReportRequest):
    """Generate a professional security report using AI"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    try:
        system_message = """You are X=π, a professional security report generator.
Create concise, professional security reports in the following format based on the findings provided.
Use technical language appropriate for the report type.
Be specific about vulnerabilities and remediation steps.
Sign as: - X=π by Carbi"""

        prompt = f"""Generate a {request.report_type} security report for target: {request.target}

Severity: {request.severity}

Findings:
{chr(10).join(f'- {f}' for f in request.findings)}

Provide:
1. Executive Summary (2-3 sentences)
2. Technical Details (brief technical analysis)
3. Recommendations (actionable steps)

Format as JSON with keys: executive_summary, technical_details, recommendations (list)"""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"report_{uuid.uuid4()}",
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse response (handle both JSON and text)
        import json
        try:
            # Try to extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                report_data = json.loads(response[json_start:json_end])
            else:
                report_data = {
                    "executive_summary": response[:300],
                    "technical_details": response,
                    "recommendations": request.findings
                }
        except:
            report_data = {
                "executive_summary": response[:300],
                "technical_details": response,
                "recommendations": ["Review findings and implement fixes"]
            }
        
        report = SecurityReport(
            target=request.target,
            report_type=request.report_type,
            severity=request.severity,
            findings=request.findings,
            executive_summary=report_data.get("executive_summary", ""),
            technical_details=report_data.get("technical_details", ""),
            recommendations=report_data.get("recommendations", [])
        )
        
        # Save report to database
        await db.security_reports.insert_one(report.dict())
        
        # Save to history
        history = ScanHistory(
            scan_type="Report Generated",
            target=request.target,
            result_summary=f"{request.report_type} report - {request.severity}"
        )
        await db.scan_history.insert_one(history.dict())
        
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

# Get saved reports
@api_router.get("/intel/reports")
async def get_security_reports():
    """Get saved security reports"""
    reports = await db.security_reports.find().sort("timestamp", -1).to_list(20)
    return [SecurityReport(**r) for r in reports]

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
