# ============================================================================
# MEXICO OSINT MODULE v2 - X=pi by Carbi
# Based on: Heriberto-Juarez/mexico-database + mexico_zipcodes
# Comprehensive Mexico geographic, postal, and OSINT data
# ============================================================================

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import re

mexico_router = APIRouter(prefix="/api/mexico", tags=["Mexico OSINT v2"])

# ============================================================================
# COMPREHENSIVE MEXICO STATES DATABASE
# ============================================================================

MEXICO_STATES = [
    {"code": "AGU", "name": "Aguascalientes", "capital": "Aguascalientes", "population": 1425607, "area_km2": 5618, "region": "Centro-Norte", "phone_code": "449"},
    {"code": "BCN", "name": "Baja California", "capital": "Mexicali", "population": 3769020, "area_km2": 71446, "region": "Noroeste", "phone_code": "686"},
    {"code": "BCS", "name": "Baja California Sur", "capital": "La Paz", "population": 798447, "area_km2": 73677, "region": "Noroeste", "phone_code": "612"},
    {"code": "CAM", "name": "Campeche", "capital": "San Francisco de Campeche", "population": 928363, "area_km2": 57924, "region": "Sureste", "phone_code": "981"},
    {"code": "CHP", "name": "Chiapas", "capital": "Tuxtla Gutierrez", "population": 5543828, "area_km2": 73289, "region": "Sureste", "phone_code": "961"},
    {"code": "CHH", "name": "Chihuahua", "capital": "Chihuahua", "population": 3741869, "area_km2": 247455, "region": "Noroeste", "phone_code": "614"},
    {"code": "COA", "name": "Coahuila", "capital": "Saltillo", "population": 3146771, "area_km2": 151563, "region": "Noreste", "phone_code": "844"},
    {"code": "COL", "name": "Colima", "capital": "Colima", "population": 731391, "area_km2": 5625, "region": "Occidente", "phone_code": "312"},
    {"code": "CMX", "name": "Ciudad de Mexico", "capital": "Ciudad de Mexico", "population": 9209944, "area_km2": 1485, "region": "Centro", "phone_code": "55"},
    {"code": "DUR", "name": "Durango", "capital": "Victoria de Durango", "population": 1832650, "area_km2": 123451, "region": "Norte", "phone_code": "618"},
    {"code": "GUA", "name": "Guanajuato", "capital": "Guanajuato", "population": 6166934, "area_km2": 30608, "region": "Centro", "phone_code": "473"},
    {"code": "GRO", "name": "Guerrero", "capital": "Chilpancingo", "population": 3540685, "area_km2": 63621, "region": "Sur", "phone_code": "747"},
    {"code": "HID", "name": "Hidalgo", "capital": "Pachuca", "population": 3082841, "area_km2": 20846, "region": "Centro", "phone_code": "771"},
    {"code": "JAL", "name": "Jalisco", "capital": "Guadalajara", "population": 8348151, "area_km2": 78599, "region": "Occidente", "phone_code": "33"},
    {"code": "MEX", "name": "Estado de Mexico", "capital": "Toluca", "population": 16992418, "area_km2": 22351, "region": "Centro", "phone_code": "722"},
    {"code": "MIC", "name": "Michoacan", "capital": "Morelia", "population": 4748846, "area_km2": 59928, "region": "Occidente", "phone_code": "443"},
    {"code": "MOR", "name": "Morelos", "capital": "Cuernavaca", "population": 1971520, "area_km2": 4893, "region": "Centro", "phone_code": "777"},
    {"code": "NAY", "name": "Nayarit", "capital": "Tepic", "population": 1235456, "area_km2": 27815, "region": "Occidente", "phone_code": "311"},
    {"code": "NLE", "name": "Nuevo Leon", "capital": "Monterrey", "population": 5784442, "area_km2": 64220, "region": "Noreste", "phone_code": "81"},
    {"code": "OAX", "name": "Oaxaca", "capital": "Oaxaca de Juarez", "population": 4132148, "area_km2": 93793, "region": "Sur", "phone_code": "951"},
    {"code": "PUE", "name": "Puebla", "capital": "Puebla", "population": 6583278, "area_km2": 34290, "region": "Centro", "phone_code": "222"},
    {"code": "QUE", "name": "Queretaro", "capital": "Santiago de Queretaro", "population": 2368467, "area_km2": 11684, "region": "Centro", "phone_code": "442"},
    {"code": "ROO", "name": "Quintana Roo", "capital": "Chetumal", "population": 1857985, "area_km2": 42361, "region": "Sureste", "phone_code": "983"},
    {"code": "SLP", "name": "San Luis Potosi", "capital": "San Luis Potosi", "population": 2822255, "area_km2": 60983, "region": "Centro-Norte", "phone_code": "444"},
    {"code": "SIN", "name": "Sinaloa", "capital": "Culiacan", "population": 3026943, "area_km2": 57377, "region": "Noroeste", "phone_code": "667"},
    {"code": "SON", "name": "Sonora", "capital": "Hermosillo", "population": 2944840, "area_km2": 179503, "region": "Noroeste", "phone_code": "662"},
    {"code": "TAB", "name": "Tabasco", "capital": "Villahermosa", "population": 2402598, "area_km2": 24738, "region": "Sureste", "phone_code": "993"},
    {"code": "TAM", "name": "Tamaulipas", "capital": "Ciudad Victoria", "population": 3527735, "area_km2": 80175, "region": "Noreste", "phone_code": "834"},
    {"code": "TLA", "name": "Tlaxcala", "capital": "Tlaxcala", "population": 1342977, "area_km2": 3991, "region": "Centro", "phone_code": "246"},
    {"code": "VER", "name": "Veracruz", "capital": "Xalapa", "population": 8062579, "area_km2": 71826, "region": "Golfo", "phone_code": "228"},
    {"code": "YUC", "name": "Yucatan", "capital": "Merida", "population": 2320898, "area_km2": 39524, "region": "Sureste", "phone_code": "999"},
    {"code": "ZAC", "name": "Zacatecas", "capital": "Zacatecas", "population": 1622138, "area_km2": 75284, "region": "Centro-Norte", "phone_code": "492"},
]

# ============================================================================
# ZIP CODE RANGES BY STATE
# ============================================================================

ZIPCODE_RANGES = {
    "AGU": {"min": 20000, "max": 20999}, "BCN": {"min": 21000, "max": 22999},
    "BCS": {"min": 23000, "max": 23999}, "CAM": {"min": 24000, "max": 24999},
    "CHP": {"min": 29000, "max": 30999}, "CHH": {"min": 31000, "max": 33999},
    "COA": {"min": 25000, "max": 27999}, "COL": {"min": 28000, "max": 28999},
    "CMX": {"min": 1000, "max": 16999}, "DUR": {"min": 34000, "max": 35999},
    "GUA": {"min": 36000, "max": 38999}, "GRO": {"min": 39000, "max": 41999},
    "HID": {"min": 42000, "max": 43999}, "JAL": {"min": 44000, "max": 49999},
    "MEX": {"min": 50000, "max": 57999}, "MIC": {"min": 58000, "max": 61999},
    "MOR": {"min": 62000, "max": 62999}, "NAY": {"min": 63000, "max": 63999},
    "NLE": {"min": 64000, "max": 67999}, "OAX": {"min": 68000, "max": 71999},
    "PUE": {"min": 72000, "max": 75999}, "QUE": {"min": 76000, "max": 76999},
    "ROO": {"min": 77000, "max": 77999}, "SLP": {"min": 78000, "max": 79999},
    "SIN": {"min": 80000, "max": 82999}, "SON": {"min": 83000, "max": 85999},
    "TAB": {"min": 86000, "max": 86999}, "TAM": {"min": 87000, "max": 89999},
    "TLA": {"min": 90000, "max": 90999}, "VER": {"min": 91000, "max": 96999},
    "YUC": {"min": 97000, "max": 97999}, "ZAC": {"min": 98000, "max": 99999},
}

# Major cities with detailed info
MAJOR_CITIES = [
    {"name": "Ciudad de Mexico", "state": "CMX", "population": 9209944, "lat": 19.4326, "lon": -99.1332, "elevation_m": 2240, "type": "capital_federal"},
    {"name": "Guadalajara", "state": "JAL", "population": 1385629, "lat": 20.6597, "lon": -103.3496, "elevation_m": 1566, "type": "capital_estatal"},
    {"name": "Monterrey", "state": "NLE", "population": 1135550, "lat": 25.6866, "lon": -100.3161, "elevation_m": 540, "type": "capital_estatal"},
    {"name": "Puebla", "state": "PUE", "population": 1434062, "lat": 19.0414, "lon": -98.2063, "elevation_m": 2135, "type": "capital_estatal"},
    {"name": "Tijuana", "state": "BCN", "population": 1810645, "lat": 32.5149, "lon": -117.0382, "elevation_m": 20, "type": "fronteriza"},
    {"name": "Leon", "state": "GUA", "population": 1238962, "lat": 21.1250, "lon": -101.6860, "elevation_m": 1798, "type": "industrial"},
    {"name": "Juarez", "state": "CHH", "population": 1321004, "lat": 31.6904, "lon": -106.4245, "elevation_m": 1137, "type": "fronteriza"},
    {"name": "Cancun", "state": "ROO", "population": 888797, "lat": 21.1619, "lon": -86.8515, "elevation_m": 10, "type": "turistica"},
    {"name": "Merida", "state": "YUC", "population": 892363, "lat": 20.9674, "lon": -89.5926, "elevation_m": 9, "type": "capital_estatal"},
    {"name": "Queretaro", "state": "QUE", "population": 801940, "lat": 20.5888, "lon": -100.3899, "elevation_m": 1820, "type": "capital_estatal"},
    {"name": "Toluca", "state": "MEX", "population": 489333, "lat": 19.2826, "lon": -99.6557, "elevation_m": 2660, "type": "capital_estatal"},
    {"name": "Acapulco", "state": "GRO", "population": 779566, "lat": 16.8531, "lon": -99.8237, "elevation_m": 3, "type": "turistica"},
    {"name": "Morelia", "state": "MIC", "population": 743275, "lat": 19.7060, "lon": -101.1950, "elevation_m": 1920, "type": "capital_estatal"},
    {"name": "Oaxaca", "state": "OAX", "population": 264251, "lat": 17.0732, "lon": -96.7266, "elevation_m": 1555, "type": "capital_estatal"},
    {"name": "Culiacan", "state": "SIN", "population": 808416, "lat": 24.7994, "lon": -107.3940, "elevation_m": 53, "type": "capital_estatal"},
    {"name": "Hermosillo", "state": "SON", "population": 715061, "lat": 29.0729, "lon": -110.9559, "elevation_m": 210, "type": "capital_estatal"},
    {"name": "Villahermosa", "state": "TAB", "population": 353577, "lat": 17.9869, "lon": -92.9303, "elevation_m": 10, "type": "capital_estatal"},
    {"name": "Saltillo", "state": "COA", "population": 823128, "lat": 25.4232, "lon": -100.9924, "elevation_m": 1600, "type": "capital_estatal"},
    {"name": "Tuxtla Gutierrez", "state": "CHP", "population": 598710, "lat": 16.7516, "lon": -93.1152, "elevation_m": 522, "type": "capital_estatal"},
    {"name": "Playa del Carmen", "state": "ROO", "population": 304942, "lat": 20.6296, "lon": -87.0739, "elevation_m": 10, "type": "turistica"},
]

# CURP validation info
CURP_INFO = {
    "format": "AAAA000000HAAAAA00",
    "length": 18,
    "components": [
        {"position": "1-4", "description": "Primera letra y vocal del apellido paterno, primera letra apellido materno, primera letra nombre"},
        {"position": "5-10", "description": "Fecha de nacimiento (AAMMDD)"},
        {"position": "11", "description": "Sexo (H=Hombre, M=Mujer)"},
        {"position": "12-13", "description": "Codigo de entidad federativa"},
        {"position": "14-16", "description": "Consonantes internas del nombre"},
        {"position": "17", "description": "Digito diferenciador de homonimos"},
        {"position": "18", "description": "Digito verificador"},
    ],
    "state_codes": {
        "AS": "Aguascalientes", "BC": "Baja California", "BS": "Baja California Sur",
        "CC": "Campeche", "CL": "Coahuila", "CM": "Colima", "CS": "Chiapas",
        "CH": "Chihuahua", "DF": "Ciudad de Mexico", "DG": "Durango",
        "GT": "Guanajuato", "GR": "Guerrero", "HG": "Hidalgo", "JC": "Jalisco",
        "MC": "Estado de Mexico", "MN": "Michoacan", "MS": "Morelos", "NT": "Nayarit",
        "NL": "Nuevo Leon", "OC": "Oaxaca", "PL": "Puebla", "QT": "Queretaro",
        "QR": "Quintana Roo", "SP": "San Luis Potosi", "SL": "Sinaloa",
        "SR": "Sonora", "TC": "Tabasco", "TS": "Tamaulipas", "TL": "Tlaxcala",
        "VZ": "Veracruz", "YN": "Yucatan", "ZS": "Zacatecas", "NE": "Nacido en extranjero",
    }
}

# RFC validation info
RFC_INFO = {
    "persona_fisica": {"format": "AAAA000000AAA", "length": 13},
    "persona_moral": {"format": "AAA000000AAA", "length": 12},
    "components": [
        {"description": "Iniciales del nombre (4 letras persona fisica, 3 persona moral)"},
        {"description": "Fecha de constitucion/nacimiento (AAMMDD)"},
        {"description": "Homoclave asignada por SAT (3 caracteres alfanumericos)"},
    ]
}

# Telecom operators
TELECOM_OPERATORS = [
    {"name": "Telcel (America Movil)", "type": "Movil", "market_share": "62%", "technology": "4G LTE / 5G", "coverage": "Nacional"},
    {"name": "AT&T Mexico", "type": "Movil", "market_share": "16%", "technology": "4G LTE / 5G", "coverage": "Nacional"},
    {"name": "Movistar (Telefonica)", "type": "Movil", "market_share": "3%", "technology": "4G LTE", "coverage": "Parcial"},
    {"name": "Altan Redes (Altcel/Bait)", "type": "Movil", "market_share": "5%", "technology": "4.5G LTE", "coverage": "Nacional"},
    {"name": "Telmex", "type": "Fijo", "market_share": "65%", "technology": "Fibra/DSL", "coverage": "Nacional"},
    {"name": "Megacable", "type": "Fijo/Cable", "market_share": "15%", "technology": "HFC/Fibra", "coverage": "Regional"},
    {"name": "Totalplay", "type": "Fijo", "market_share": "8%", "technology": "FTTH", "coverage": "Urbano"},
    {"name": "Izzi", "type": "Fijo/Cable", "market_share": "10%", "technology": "HFC/Fibra", "coverage": "Regional"},
]


# ============================================================================
# ENDPOINTS
# ============================================================================

@mexico_router.get("/states")
async def get_states(region: Optional[str] = None):
    """Get all Mexican states with detailed info"""
    states = MEXICO_STATES
    if region:
        states = [s for s in states if region.lower() in s["region"].lower()]
    return {
        "module": "Mexico OSINT v2 - X=pi by Carbi",
        "total_states": len(states),
        "states": states,
        "regions": list(set(s["region"] for s in MEXICO_STATES)),
        "timestamp": datetime.utcnow().isoformat()
    }


@mexico_router.get("/state/{code}")
async def get_state_detail(code: str):
    """Get detailed info for a specific state"""
    code = code.upper()
    state = next((s for s in MEXICO_STATES if s["code"] == code), None)
    if not state:
        raise HTTPException(status_code=404, detail=f"State {code} not found")

    cities = [c for c in MAJOR_CITIES if c["state"] == code]
    zips = ZIPCODE_RANGES.get(code, {})

    return {
        "state": state,
        "cities": cities,
        "zip_range": zips,
        "telecom_coverage": [t for t in TELECOM_OPERATORS if t["coverage"] == "Nacional" or code in ["CMX", "JAL", "NLE"]],
        "timestamp": datetime.utcnow().isoformat()
    }


@mexico_router.get("/cities")
async def get_cities(state: Optional[str] = None, city_type: Optional[str] = None):
    """Get major Mexican cities"""
    cities = MAJOR_CITIES
    if state:
        cities = [c for c in cities if c["state"] == state.upper()]
    if city_type:
        cities = [c for c in cities if c["type"] == city_type]

    return {
        "total_cities": len(cities),
        "cities": cities,
        "city_types": list(set(c["type"] for c in MAJOR_CITIES)),
        "timestamp": datetime.utcnow().isoformat()
    }


@mexico_router.get("/zipcode/{code}")
async def lookup_zipcode(code: str):
    """Lookup a Mexican zip code to find its state and region"""
    try:
        zip_num = int(code)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid zip code format")

    found_state = None
    for state_code, ranges in ZIPCODE_RANGES.items():
        if ranges["min"] <= zip_num <= ranges["max"]:
            found_state = next((s for s in MEXICO_STATES if s["code"] == state_code), None)
            break

    if not found_state:
        raise HTTPException(status_code=404, detail=f"Zip code {code} not found in Mexico database")

    nearby_cities = [c for c in MAJOR_CITIES if c["state"] == found_state["code"]]

    return {
        "zip_code": code,
        "state": found_state,
        "nearby_cities": nearby_cities,
        "zip_range": ZIPCODE_RANGES.get(found_state["code"]),
        "timestamp": datetime.utcnow().isoformat()
    }


@mexico_router.post("/validate/curp")
async def validate_curp(curp: str):
    """Validate and decode a Mexican CURP"""
    curp = curp.upper().strip()

    if len(curp) != 18:
        return {"valid": False, "error": "CURP must be 18 characters", "curp": curp}

    curp_regex = r'^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$'
    if not re.match(curp_regex, curp):
        return {"valid": False, "error": "Invalid CURP format", "curp": curp}

    # Decode components
    birth_date = curp[4:10]
    sex = "Masculino" if curp[10] == "H" else "Femenino"
    state_code = curp[11:13]
    state_name = CURP_INFO["state_codes"].get(state_code, "Desconocido")

    year = int(birth_date[0:2])
    month = int(birth_date[2:4])
    day = int(birth_date[4:6])
    full_year = 1900 + year if year > 50 else 2000 + year

    return {
        "valid": True,
        "curp": curp,
        "decoded": {
            "initials": curp[0:4],
            "birth_date": f"{full_year}-{month:02d}-{day:02d}",
            "sex": sex,
            "state_of_birth": state_name,
            "state_code": state_code,
        },
        "format_info": CURP_INFO["components"],
        "timestamp": datetime.utcnow().isoformat()
    }


@mexico_router.post("/validate/rfc")
async def validate_rfc(rfc: str):
    """Validate and decode a Mexican RFC"""
    rfc = rfc.upper().strip()

    if len(rfc) == 13:
        rfc_type = "Persona Fisica"
        regex = r'^[A-Z]{4}\d{6}[A-Z0-9]{3}$'
    elif len(rfc) == 12:
        rfc_type = "Persona Moral"
        regex = r'^[A-Z]{3}\d{6}[A-Z0-9]{3}$'
    else:
        return {"valid": False, "error": "RFC must be 12 or 13 characters", "rfc": rfc}

    if not re.match(regex, rfc):
        return {"valid": False, "error": "Invalid RFC format", "rfc": rfc}

    offset = 4 if len(rfc) == 13 else 3
    date_part = rfc[offset:offset + 6]
    year = int(date_part[0:2])
    month = int(date_part[2:4])
    day = int(date_part[4:6])
    full_year = 1900 + year if year > 30 else 2000 + year
    homoclave = rfc[-3:]

    return {
        "valid": True,
        "rfc": rfc,
        "type": rfc_type,
        "decoded": {
            "initials": rfc[:offset],
            "constitution_date": f"{full_year}-{month:02d}-{day:02d}",
            "homoclave": homoclave,
        },
        "format_info": RFC_INFO["components"],
        "timestamp": datetime.utcnow().isoformat()
    }


@mexico_router.get("/telecom")
async def get_telecom_info():
    """Get Mexico telecom operators and coverage info"""
    return {
        "module": "Mexico Telecom Intelligence - X=pi by Carbi",
        "total_operators": len(TELECOM_OPERATORS),
        "operators": TELECOM_OPERATORS,
        "phone_format": {
            "country_code": "+52",
            "mobile_digits": 10,
            "example": "+52 55 1234 5678",
            "lada_codes": {s["phone_code"]: s["name"] for s in MEXICO_STATES}
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@mexico_router.get("/dashboard")
async def mexico_dashboard():
    """Mexico OSINT Dashboard - overview of all available data"""
    return {
        "module": "Mexico OSINT v2 - X=pi by Carbi",
        "sources": ["Heriberto-Juarez/mexico-database", "mexico_zipcodes", "INEGI", "IFT"],
        "available_data": {
            "states": len(MEXICO_STATES),
            "major_cities": len(MAJOR_CITIES),
            "zip_code_ranges": len(ZIPCODE_RANGES),
            "telecom_operators": len(TELECOM_OPERATORS),
            "curp_state_codes": len(CURP_INFO["state_codes"]),
        },
        "tools": [
            {"name": "State Lookup", "endpoint": "/api/mexico/states", "description": "Buscar estados con filtro por region"},
            {"name": "City Lookup", "endpoint": "/api/mexico/cities", "description": "Buscar ciudades principales"},
            {"name": "Zip Code Lookup", "endpoint": "/api/mexico/zipcode/{code}", "description": "Buscar codigo postal"},
            {"name": "CURP Validator", "endpoint": "/api/mexico/validate/curp", "description": "Validar y decodificar CURP"},
            {"name": "RFC Validator", "endpoint": "/api/mexico/validate/rfc", "description": "Validar y decodificar RFC"},
            {"name": "Telecom Info", "endpoint": "/api/mexico/telecom", "description": "Operadores y cobertura"},
        ],
        "timestamp": datetime.utcnow().isoformat()
    }
