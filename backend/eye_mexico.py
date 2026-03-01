# El Ojo del Diablo - México Edition
# Advanced OSINT & Threat Intelligence Module
# by Carbi - X=π

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import httpx
import asyncio
import hashlib
import re
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Create router
eye_router = APIRouter(prefix="/api/eye-mx", tags=["El Ojo del Diablo - México"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# ============ MÉXICO DATA ============

MEXICO_STATES = {
    "MIC": {
        "name": "Michoacán",
        "capital": "Morelia",
        "lat": 19.7006,
        "lon": -101.1844,
        "population": 4748846,
        "domains": [".gob.mx", ".edu.mx", ".com.mx"],
        "major_cities": ["Morelia", "Uruapan", "Zamora", "Lázaro Cárdenas", "Apatzingán"],
        "universities": ["UMSNH", "ITESM Morelia", "UVAQ"],
        "key_industries": ["Agriculture", "Mining", "Tourism", "Manufacturing"],
        "risk_score": 78
    },
    "JAL": {
        "name": "Jalisco",
        "capital": "Guadalajara",
        "lat": 20.6597,
        "lon": -103.3496,
        "population": 8348151,
        "major_cities": ["Guadalajara", "Zapopan", "Tlaquepaque", "Puerto Vallarta", "Tlajomulco"],
        "universities": ["UDG", "ITESO", "ITESM GDL", "UAG"],
        "key_industries": ["Technology", "Manufacturing", "Tequila", "Tourism"],
        "risk_score": 72
    },
    "QRO": {
        "name": "Querétaro",
        "capital": "Santiago de Querétaro",
        "lat": 20.5888,
        "lon": -100.3899,
        "population": 2368467,
        "major_cities": ["Querétaro", "San Juan del Río", "El Marqués", "Corregidora"],
        "universities": ["UAQ", "ITESM QRO", "UTEQ"],
        "key_industries": ["Aerospace", "Automotive", "IT Services", "Manufacturing"],
        "risk_score": 65
    },
    "NLE": {
        "name": "Nuevo León",
        "capital": "Monterrey",
        "lat": 25.6866,
        "lon": -100.3161,
        "population": 5784442,
        "major_cities": ["Monterrey", "Guadalupe", "San Nicolás", "Apodaca", "Santa Catarina"],
        "universities": ["UANL", "ITESM MTY", "UDEM", "UR"],
        "key_industries": ["Steel", "Cement", "Glass", "Banking", "Technology"],
        "risk_score": 70
    },
    "GTO": {
        "name": "Guanajuato",
        "capital": "Guanajuato",
        "lat": 21.019,
        "lon": -101.2574,
        "population": 6166934,
        "major_cities": ["León", "Irapuato", "Celaya", "Salamanca", "Guanajuato"],
        "universities": ["UG", "ITESM León", "La Salle Bajío"],
        "key_industries": ["Automotive", "Leather", "Agriculture", "Tourism"],
        "risk_score": 75
    },
    "GRO": {
        "name": "Guerrero",
        "capital": "Chilpancingo",
        "lat": 17.5552,
        "lon": -99.5003,
        "population": 3540685,
        "major_cities": ["Acapulco", "Chilpancingo", "Iguala", "Taxco", "Zihuatanejo"],
        "universities": ["UAG", "ITESM Acapulco"],
        "key_industries": ["Tourism", "Mining", "Agriculture", "Fishing"],
        "risk_score": 82
    }
}

# Mexican breach database (simulated from public sources)
MEXICO_BREACH_DATABASE = [
    {
        "id": "MX-2024-001",
        "name": "Banco Azteca Breach",
        "date": "2024-01-15",
        "records": 4500000,
        "affected_states": ["JAL", "NLE", "GTO", "MIC"],
        "data_types": ["email", "phone", "address", "financial"],
        "severity": "CRITICAL"
    },
    {
        "id": "MX-2024-002", 
        "name": "CFE Database Leak",
        "date": "2024-02-20",
        "records": 12000000,
        "affected_states": ["ALL"],
        "data_types": ["name", "address", "energy_consumption", "RFC"],
        "severity": "HIGH"
    },
    {
        "id": "MX-2023-015",
        "name": "IMSS Patient Records",
        "date": "2023-11-08",
        "records": 8500000,
        "affected_states": ["JAL", "NLE", "QRO", "GTO"],
        "data_types": ["name", "CURP", "medical_history", "address"],
        "severity": "CRITICAL"
    },
    {
        "id": "MX-2023-012",
        "name": "University Database Leak",
        "date": "2023-09-15",
        "records": 2300000,
        "affected_states": ["JAL", "NLE", "MIC"],
        "data_types": ["name", "email", "student_id", "grades"],
        "severity": "MEDIUM"
    },
    {
        "id": "MX-2023-008",
        "name": "E-commerce Platform Breach",
        "date": "2023-07-22",
        "records": 6700000,
        "affected_states": ["ALL"],
        "data_types": ["email", "password_hash", "address", "payment_partial"],
        "severity": "HIGH"
    },
    {
        "id": "MX-2024-005",
        "name": "Telcel Customer Data",
        "date": "2024-03-10",
        "records": 15000000,
        "affected_states": ["ALL"],
        "data_types": ["phone", "name", "address", "IMEI"],
        "severity": "CRITICAL"
    },
    {
        "id": "MX-2023-020",
        "name": "Government Portal Leak",
        "date": "2023-12-01",
        "records": 3200000,
        "affected_states": ["MIC", "GRO", "GTO"],
        "data_types": ["CURP", "RFC", "address", "voter_id"],
        "severity": "CRITICAL"
    }
]

# Mexican public data sources
MEXICO_PUBLIC_SOURCES = [
    {"name": "RENAPO", "type": "government", "data": ["CURP verification"]},
    {"name": "SAT", "type": "government", "data": ["RFC validation"]},
    {"name": "INE", "type": "government", "data": ["Voter registry"]},
    {"name": "PROFECO", "type": "government", "data": ["Consumer complaints"]},
    {"name": "CONDUSEF", "type": "government", "data": ["Financial complaints"]},
    {"name": "Buró de Crédito", "type": "private", "data": ["Credit history"]},
    {"name": "Círculo de Crédito", "type": "private", "data": ["Credit history"]},
]

# ============ MODELS ============

class MexicoSearchRequest(BaseModel):
    query: str
    search_type: str  # curp, rfc, email, phone, name, domain
    states: List[str] = []  # State codes to filter

class MexicoSearchResult(BaseModel):
    query: str
    search_type: str
    total_results: int
    affected_states: List[str]
    breach_matches: List[dict]
    risk_score: int
    geo_data: List[dict]
    recommendations: List[str]
    ai_analysis: Optional[str] = None

class StateIntelRequest(BaseModel):
    state_code: str

class StateIntelResult(BaseModel):
    state: dict
    breach_count: int
    total_records_exposed: int
    recent_breaches: List[dict]
    threat_level: str
    industries_at_risk: List[str]
    recommendations: List[str]

class EntityCorrelationRequest(BaseModel):
    entity: str
    entity_type: str  # email, phone, curp, rfc, domain

class EntityCorrelationResult(BaseModel):
    entity: str
    entity_type: str
    correlations: List[dict]
    exposure_score: int
    timeline: List[dict]
    related_entities: List[dict]

class MexicoDashboardResult(BaseModel):
    total_breaches: int
    total_records_exposed: int
    states_summary: List[dict]
    recent_activity: List[dict]
    threat_trends: dict
    top_affected_sectors: List[dict]

class AIAnalysisRequest(BaseModel):
    data: dict
    analysis_type: str  # risk, correlation, prediction, report

# ============ HELPER FUNCTIONS ============

def validate_curp(curp: str) -> dict:
    """Validate Mexican CURP format and extract info"""
    curp = curp.upper().strip()
    curp_pattern = r'^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$'
    
    if not re.match(curp_pattern, curp):
        return {"valid": False, "error": "Invalid CURP format"}
    
    # Extract info from CURP
    birth_date = f"19{curp[4:6]}" if int(curp[4:6]) > 30 else f"20{curp[4:6]}"
    gender = "Male" if curp[10] == "H" else "Female"
    
    state_codes = {
        "AS": "Aguascalientes", "BC": "Baja California", "BS": "Baja California Sur",
        "CC": "Campeche", "CL": "Coahuila", "CM": "Colima", "CS": "Chiapas",
        "CH": "Chihuahua", "DF": "CDMX", "DG": "Durango", "GT": "Guanajuato",
        "GR": "Guerrero", "HG": "Hidalgo", "JC": "Jalisco", "MC": "Estado de México",
        "MN": "Michoacán", "MS": "Morelos", "NT": "Nayarit", "NL": "Nuevo León",
        "OC": "Oaxaca", "PL": "Puebla", "QT": "Querétaro", "QR": "Quintana Roo",
        "SP": "San Luis Potosí", "SL": "Sinaloa", "SR": "Sonora", "TC": "Tabasco",
        "TS": "Tamaulipas", "TL": "Tlaxcala", "VZ": "Veracruz", "YN": "Yucatán",
        "ZS": "Zacatecas", "NE": "Nacido Extranjero"
    }
    
    state_code = curp[11:13]
    birth_state = state_codes.get(state_code, "Unknown")
    
    return {
        "valid": True,
        "curp": curp,
        "birth_year": birth_date,
        "gender": gender,
        "birth_state": birth_state,
        "state_code": state_code
    }

def validate_rfc(rfc: str) -> dict:
    """Validate Mexican RFC format"""
    rfc = rfc.upper().strip()
    
    # RFC persona física: 13 caracteres
    # RFC persona moral: 12 caracteres
    rfc_fisica = r'^[A-Z]{4}\d{6}[A-Z\d]{3}$'
    rfc_moral = r'^[A-Z]{3}\d{6}[A-Z\d]{3}$'
    
    if re.match(rfc_fisica, rfc):
        return {"valid": True, "rfc": rfc, "type": "Persona Física"}
    elif re.match(rfc_moral, rfc):
        return {"valid": True, "rfc": rfc, "type": "Persona Moral"}
    else:
        return {"valid": False, "error": "Invalid RFC format"}

def calculate_exposure_score(breaches: List[dict], data_types: List[str]) -> int:
    """Calculate exposure risk score based on breaches and data types"""
    score = 0
    
    # Weight by data type sensitivity
    sensitivity_weights = {
        "password": 25, "financial": 25, "medical_history": 25,
        "CURP": 20, "RFC": 20, "voter_id": 20,
        "phone": 15, "address": 15, "email": 10,
        "name": 5
    }
    
    for breach in breaches:
        base_score = 10  # Base score per breach
        severity_multiplier = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1.5, "LOW": 1}
        multiplier = severity_multiplier.get(breach.get("severity", "MEDIUM"), 1)
        
        for dt in breach.get("data_types", []):
            base_score += sensitivity_weights.get(dt, 5)
        
        score += base_score * multiplier
    
    return min(100, int(score))

# ============ ROUTES ============

@eye_router.get("/mexico/dashboard", response_model=MexicoDashboardResult)
async def get_mexico_dashboard():
    """Get comprehensive Mexico threat intelligence dashboard"""
    
    # Calculate totals
    total_records = sum(b["records"] for b in MEXICO_BREACH_DATABASE)
    
    # State summaries
    states_summary = []
    for code, state in MEXICO_STATES.items():
        state_breaches = [b for b in MEXICO_BREACH_DATABASE 
                        if code in b["affected_states"] or "ALL" in b["affected_states"]]
        state_records = sum(b["records"] for b in state_breaches)
        
        states_summary.append({
            "code": code,
            "name": state["name"],
            "lat": state["lat"],
            "lon": state["lon"],
            "breach_count": len(state_breaches),
            "records_exposed": state_records,
            "risk_score": state["risk_score"],
            "population": state["population"]
        })
    
    # Sort by risk
    states_summary.sort(key=lambda x: x["risk_score"], reverse=True)
    
    # Recent activity
    recent_activity = sorted(MEXICO_BREACH_DATABASE, 
                            key=lambda x: x["date"], reverse=True)[:5]
    
    # Threat trends
    threat_trends = {
        "financial": 35,
        "government": 25,
        "healthcare": 20,
        "education": 12,
        "telecom": 8
    }
    
    # Top affected sectors
    top_sectors = [
        {"sector": "Financial Services", "breaches": 12, "records": 15000000},
        {"sector": "Government", "breaches": 8, "records": 12000000},
        {"sector": "Healthcare", "breaches": 6, "records": 8500000},
        {"sector": "Telecommunications", "breaches": 5, "records": 20000000},
        {"sector": "Education", "breaches": 4, "records": 2300000}
    ]
    
    return MexicoDashboardResult(
        total_breaches=len(MEXICO_BREACH_DATABASE),
        total_records_exposed=total_records,
        states_summary=states_summary,
        recent_activity=recent_activity,
        threat_trends=threat_trends,
        top_affected_sectors=top_sectors
    )

@eye_router.post("/mexico/search", response_model=MexicoSearchResult)
async def mexico_deep_search(request: MexicoSearchRequest):
    """Deep search with Mexico focus"""
    query = request.query.strip()
    search_type = request.search_type.lower()
    target_states = request.states if request.states else list(MEXICO_STATES.keys())
    
    results = []
    affected_states = set()
    geo_data = []
    recommendations = []
    
    # Validate and process based on search type
    if search_type == "curp":
        curp_info = validate_curp(query)
        if curp_info["valid"]:
            # Find breaches that could contain this CURP
            for breach in MEXICO_BREACH_DATABASE:
                if "CURP" in breach["data_types"]:
                    if any(s in target_states for s in breach["affected_states"]) or "ALL" in breach["affected_states"]:
                        results.append({
                            "source": breach["name"],
                            "date": breach["date"],
                            "severity": breach["severity"],
                            "data_exposed": breach["data_types"],
                            "match_type": "potential"
                        })
                        affected_states.update(breach["affected_states"])
            
            # Add geo data for birth state
            if curp_info["birth_state"] != "Unknown":
                for code, state in MEXICO_STATES.items():
                    if state["name"] in curp_info["birth_state"] or curp_info["state_code"] in ["MN", "JC", "QT", "NL", "GT", "GR"]:
                        geo_data.append({
                            "lat": state["lat"],
                            "lon": state["lon"],
                            "label": f"Birth State: {state['name']}",
                            "type": "origin"
                        })
            
            recommendations.append("Monitor credit reports regularly")
            recommendations.append("Enable 2FA on all financial accounts")
            recommendations.append("Review PROFECO for fraudulent use of identity")
    
    elif search_type == "rfc":
        rfc_info = validate_rfc(query)
        if rfc_info["valid"]:
            for breach in MEXICO_BREACH_DATABASE:
                if "RFC" in breach["data_types"]:
                    results.append({
                        "source": breach["name"],
                        "date": breach["date"],
                        "severity": breach["severity"],
                        "data_exposed": breach["data_types"]
                    })
                    affected_states.update(breach["affected_states"])
            
            recommendations.append("Verify SAT portal for unauthorized access")
            recommendations.append("Check for fraudulent tax filings")
    
    elif search_type == "email":
        if "@" in query:
            domain = query.split("@")[1]
            
            # Check against Mexican domains
            for breach in MEXICO_BREACH_DATABASE:
                if "email" in breach["data_types"]:
                    if any(s in target_states for s in breach["affected_states"]) or "ALL" in breach["affected_states"]:
                        results.append({
                            "source": breach["name"],
                            "date": breach["date"],
                            "severity": breach["severity"],
                            "data_exposed": breach["data_types"]
                        })
                        affected_states.update(breach["affected_states"])
            
            # Add Mexican-specific checks
            if ".mx" in domain or any(d in domain for d in ["telmex", "prodigy", "infinitum"]):
                recommendations.append("This is a Mexican email domain - higher local exposure risk")
    
    elif search_type == "phone":
        # Mexican phone format validation
        phone_clean = re.sub(r'[\s\-\(\)\+]', '', query)
        
        if phone_clean.startswith("52"):
            phone_clean = phone_clean[2:]
        
        # Check area codes for target states
        state_area_codes = {
            "MIC": ["443", "351", "452", "753"],  # Morelia, Zamora, Uruapan, Lázaro Cárdenas
            "JAL": ["33", "322", "341", "378"],   # GDL, Puerto Vallarta
            "QRO": ["442", "427"],                 # Querétaro, San Juan del Río
            "NLE": ["81", "821", "826"],           # Monterrey
            "GTO": ["477", "462", "461", "473"],   # León, Irapuato, Celaya, Guanajuato
            "GRO": ["744", "747", "755"]           # Acapulco, Chilpancingo, Zihuatanejo
        }
        
        for code, areas in state_area_codes.items():
            for area in areas:
                if phone_clean.startswith(area):
                    if code in MEXICO_STATES:
                        state = MEXICO_STATES[code]
                        affected_states.add(code)
                        geo_data.append({
                            "lat": state["lat"],
                            "lon": state["lon"],
                            "label": f"Phone Area: {state['name']}",
                            "type": "phone_location"
                        })
        
        for breach in MEXICO_BREACH_DATABASE:
            if "phone" in breach["data_types"]:
                results.append({
                    "source": breach["name"],
                    "date": breach["date"],
                    "severity": breach["severity"]
                })
        
        recommendations.append("Register in REPEP (Registro Público para Evitar Publicidad)")
    
    elif search_type == "domain":
        if ".mx" in query or ".gob.mx" in query:
            # Mexican government domain
            recommendations.append("Government domain - check datos.gob.mx for public data")
            
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    # DNS lookup
                    import socket
                    ip = socket.gethostbyname(query.replace("https://", "").replace("http://", "").split("/")[0])
                    
                    geo_response = await client.get(f"http://ip-api.com/json/{ip}")
                    if geo_response.status_code == 200:
                        geo_info = geo_response.json()
                        geo_data.append({
                            "lat": geo_info.get("lat"),
                            "lon": geo_info.get("lon"),
                            "label": query,
                            "type": "domain"
                        })
            except:
                pass
    
    # Add geo data for affected states
    for state_code in affected_states:
        if state_code in MEXICO_STATES and state_code != "ALL":
            state = MEXICO_STATES[state_code]
            geo_data.append({
                "lat": state["lat"],
                "lon": state["lon"],
                "label": state["name"],
                "type": "affected_state"
            })
    
    # Calculate risk score
    risk_score = calculate_exposure_score(results, [search_type])
    
    # Save to history
    await db.eye_mx_searches.insert_one({
        "query": query[:50],  # Truncate for privacy
        "type": search_type,
        "results_count": len(results),
        "risk_score": risk_score,
        "timestamp": datetime.utcnow()
    })
    
    return MexicoSearchResult(
        query=query,
        search_type=search_type,
        total_results=len(results),
        affected_states=list(affected_states),
        breach_matches=results,
        risk_score=risk_score,
        geo_data=geo_data,
        recommendations=recommendations
    )

@eye_router.get("/mexico/state/{state_code}", response_model=StateIntelResult)
async def get_state_intelligence(state_code: str):
    """Get detailed intelligence for a specific Mexican state"""
    state_code = state_code.upper()
    
    if state_code not in MEXICO_STATES:
        raise HTTPException(status_code=404, detail=f"State {state_code} not found")
    
    state = MEXICO_STATES[state_code]
    
    # Get breaches affecting this state
    state_breaches = [b for b in MEXICO_BREACH_DATABASE 
                     if state_code in b["affected_states"] or "ALL" in b["affected_states"]]
    
    total_records = sum(b["records"] for b in state_breaches)
    
    # Determine threat level
    risk = state["risk_score"]
    if risk >= 80:
        threat_level = "CRITICAL"
    elif risk >= 70:
        threat_level = "HIGH"
    elif risk >= 60:
        threat_level = "MEDIUM"
    else:
        threat_level = "LOW"
    
    # Industries at risk
    industries_at_risk = state["key_industries"][:4]
    
    # Recommendations based on state
    recommendations = [
        f"Monitor {state['capital']} area for targeted attacks",
        f"Universities ({', '.join(state['universities'][:2])}) are high-value targets",
        "Enable multi-factor authentication for all financial services",
        "Register in PROFECO consumer protection system",
        f"Contact local CERT-MX for {state['name']} specific advisories"
    ]
    
    return StateIntelResult(
        state={
            "code": state_code,
            "name": state["name"],
            "capital": state["capital"],
            "lat": state["lat"],
            "lon": state["lon"],
            "population": state["population"],
            "major_cities": state["major_cities"],
            "universities": state["universities"]
        },
        breach_count=len(state_breaches),
        total_records_exposed=total_records,
        recent_breaches=sorted(state_breaches, key=lambda x: x["date"], reverse=True)[:5],
        threat_level=threat_level,
        industries_at_risk=industries_at_risk,
        recommendations=recommendations
    )

@eye_router.post("/mexico/correlate", response_model=EntityCorrelationResult)
async def correlate_entity(request: EntityCorrelationRequest):
    """Correlate entity across multiple data sources"""
    entity = request.entity.strip()
    entity_type = request.entity_type.lower()
    
    correlations = []
    related_entities = []
    timeline = []
    
    # Simulate correlation engine
    if entity_type == "email":
        # Extract username and domain
        if "@" in entity:
            username = entity.split("@")[0]
            domain = entity.split("@")[1]
            
            correlations.append({
                "type": "username_derived",
                "value": username,
                "confidence": "high",
                "source": "email_parsing"
            })
            
            correlations.append({
                "type": "domain",
                "value": domain,
                "confidence": "high",
                "source": "email_parsing"
            })
            
            # Common patterns
            related_entities.append({
                "type": "possible_username",
                "value": username,
                "platforms": ["Twitter", "Facebook", "LinkedIn", "GitHub"]
            })
            
            # Check for Mexican patterns
            if any(d in domain for d in [".mx", "telmex", "prodigy"]):
                correlations.append({
                    "type": "country",
                    "value": "Mexico",
                    "confidence": "high",
                    "source": "domain_analysis"
                })
    
    elif entity_type == "curp":
        curp_info = validate_curp(entity)
        if curp_info["valid"]:
            correlations.append({
                "type": "birth_state",
                "value": curp_info["birth_state"],
                "confidence": "verified",
                "source": "curp_structure"
            })
            correlations.append({
                "type": "birth_year",
                "value": curp_info["birth_year"],
                "confidence": "verified",
                "source": "curp_structure"
            })
            correlations.append({
                "type": "gender",
                "value": curp_info["gender"],
                "confidence": "verified",
                "source": "curp_structure"
            })
            
            # Derive RFC from CURP (first 10 characters)
            related_entities.append({
                "type": "rfc_derived",
                "value": entity[:10] + "???",
                "confidence": "partial"
            })
    
    elif entity_type == "phone":
        phone_clean = re.sub(r'[\s\-\(\)\+]', '', entity)
        if phone_clean.startswith("52"):
            phone_clean = phone_clean[2:]
        
        area_code = phone_clean[:2] if len(phone_clean) >= 10 else phone_clean[:3]
        
        # Identify state from area code
        area_to_state = {
            "33": "Jalisco", "81": "Nuevo León", "442": "Querétaro",
            "443": "Michoacán", "477": "Guanajuato", "744": "Guerrero"
        }
        
        for code, state in area_to_state.items():
            if phone_clean.startswith(code):
                correlations.append({
                    "type": "state",
                    "value": state,
                    "confidence": "high",
                    "source": "area_code_analysis"
                })
                break
        
        correlations.append({
            "type": "carrier",
            "value": "Unknown (requires lookup)",
            "confidence": "low",
            "source": "phone_analysis"
        })
    
    # Build timeline from breaches
    for breach in MEXICO_BREACH_DATABASE:
        if entity_type in [dt.replace("_", "") for dt in breach["data_types"]]:
            timeline.append({
                "date": breach["date"],
                "event": f"Potential exposure in {breach['name']}",
                "severity": breach["severity"]
            })
    
    timeline.sort(key=lambda x: x["date"], reverse=True)
    
    # Calculate exposure score
    exposure_score = min(100, len(correlations) * 15 + len(timeline) * 10)
    
    return EntityCorrelationResult(
        entity=entity,
        entity_type=entity_type,
        correlations=correlations,
        exposure_score=exposure_score,
        timeline=timeline[:10],
        related_entities=related_entities
    )

@eye_router.post("/mexico/ai-analysis")
async def ai_deep_analysis(request: AIAnalysisRequest):
    """AI-powered analysis of Mexican threat data"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
    
    try:
        system_prompt = """Eres El Ojo del Diablo, un sistema de inteligencia de amenazas especializado en México.
Tu rol es analizar datos de ciberseguridad y proporcionar insights accionables.
Enfócate en:
- Patrones de brechas de datos en México
- Vulnerabilidades específicas por estado/región
- Recomendaciones de protección para ciudadanos mexicanos
- Análisis de riesgo basado en CURP, RFC, y datos personales
Responde en español. Firma como: - El Ojo del Diablo by Carbi"""

        analysis_prompts = {
            "risk": f"Analiza el siguiente perfil de riesgo y proporciona recomendaciones específicas para México:\n{request.data}",
            "correlation": f"Analiza las correlaciones encontradas y sugiere investigaciones adicionales:\n{request.data}",
            "prediction": f"Basándote en los datos históricos de brechas en México, predice tendencias futuras:\n{request.data}",
            "report": f"Genera un reporte ejecutivo de seguridad basado en:\n{request.data}"
        }
        
        prompt = analysis_prompts.get(request.analysis_type, str(request.data))
        
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"eye_mx_{uuid.uuid4()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        return {
            "analysis_type": request.analysis_type,
            "result": response,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@eye_router.get("/mexico/heatmap")
async def get_mexico_heatmap():
    """Get heatmap data for Mexican states threat levels"""
    heatmap_data = []
    
    for code, state in MEXICO_STATES.items():
        breaches = [b for b in MEXICO_BREACH_DATABASE 
                   if code in b["affected_states"] or "ALL" in b["affected_states"]]
        records = sum(b["records"] for b in breaches)
        
        # Calculate intensity (0-1)
        intensity = min(1.0, state["risk_score"] / 100)
        
        heatmap_data.append({
            "code": code,
            "name": state["name"],
            "lat": state["lat"],
            "lon": state["lon"],
            "intensity": intensity,
            "risk_score": state["risk_score"],
            "breach_count": len(breaches),
            "records_exposed": records,
            "population": state["population"],
            "per_capita_exposure": round(records / state["population"] * 100, 2)
        })
    
    # Sort by risk
    heatmap_data.sort(key=lambda x: x["risk_score"], reverse=True)
    
    return {
        "type": "mexico_threat_heatmap",
        "data": heatmap_data,
        "timestamp": datetime.utcnow().isoformat(),
        "focus_states": ["MIC", "JAL", "QRO", "NLE", "GTO", "GRO"]
    }

@eye_router.get("/mexico/realtime-threats")
async def get_realtime_threats():
    """Get simulated real-time threat feed for Mexico"""
    import random
    
    threat_types = [
        "Phishing Campaign Detected",
        "Credential Stuffing Attack",
        "New Breach Reported",
        "Ransomware Activity",
        "DDoS Attack",
        "SQL Injection Attempt",
        "Brute Force Attack"
    ]
    
    targets = [
        "Banking Sector", "Government Portal", "University System",
        "Healthcare Provider", "E-commerce Platform", "Telecom Provider"
    ]
    
    threats = []
    for i in range(10):
        state_code = random.choice(list(MEXICO_STATES.keys()))
        state = MEXICO_STATES[state_code]
        
        threats.append({
            "id": f"RT-{uuid.uuid4().hex[:8].upper()}",
            "type": random.choice(threat_types),
            "target": random.choice(targets),
            "state": state["name"],
            "state_code": state_code,
            "lat": state["lat"] + random.uniform(-0.5, 0.5),
            "lon": state["lon"] + random.uniform(-0.5, 0.5),
            "severity": random.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
            "timestamp": datetime.utcnow().isoformat(),
            "status": random.choice(["active", "mitigated", "investigating"])
        })
    
    return {
        "threats": threats,
        "total_active": sum(1 for t in threats if t["status"] == "active"),
        "last_updated": datetime.utcnow().isoformat()
    }
