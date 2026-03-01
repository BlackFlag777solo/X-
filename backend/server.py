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
