# ============================================================================
# GOOGLE HACKING DATABASE MODULE - X=pi by Carbi
# Based on: readloud/Google-Hacking-Database
# OSINT research tool using Google Dorks
# ============================================================================

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

dorks_router = APIRouter(prefix="/api/dorks", tags=["Google Hacking Database"])

# ============================================================================
# COMPREHENSIVE GOOGLE DORKS DATABASE
# ============================================================================

SEARCH_OPERATORS = [
    {"operator": "site:", "description": "Buscar solo en un dominio especifico", "syntax": "site:example.com", "example": "site:gov.mx passwords"},
    {"operator": "intitle:", "description": "Palabra clave debe estar en el titulo", "syntax": "intitle:keyword", "example": "intitle:\"index of\" passwords"},
    {"operator": "inurl:", "description": "Palabra clave debe estar en la URL", "syntax": "inurl:keyword", "example": "inurl:admin login"},
    {"operator": "intext:", "description": "Palabra clave en el texto del documento", "syntax": "intext:keyword", "example": "intext:password filetype:log"},
    {"operator": "filetype:", "description": "Buscar tipo especifico de archivo", "syntax": "filetype:pdf", "example": "filetype:sql \"insert into\""},
    {"operator": "ext:", "description": "Buscar extension de archivo", "syntax": "ext:pdf", "example": "ext:env DB_PASSWORD"},
    {"operator": "cache:", "description": "Version en cache de un sitio", "syntax": "cache:domain.com", "example": "cache:example.com"},
    {"operator": "link:", "description": "Paginas que enlazan a un sitio", "syntax": "link:domain.com", "example": "link:example.com"},
    {"operator": "related:", "description": "Sitios relacionados", "syntax": "related:domain.com", "example": "related:google.com"},
    {"operator": "info:", "description": "Info sobre un sitio web", "syntax": "info:domain.com", "example": "info:google.com"},
    {"operator": "define:", "description": "Definicion de una palabra", "syntax": "define:word", "example": "define:phishing"},
    {"operator": "\"\"", "description": "Coincidencia exacta", "syntax": "\"exact phrase\"", "example": "\"error de autenticacion\""},
    {"operator": "*", "description": "Comodin - cualquier palabra", "syntax": "how to * a website", "example": "\"admin * password\""},
    {"operator": "-", "description": "Excluir resultados", "syntax": "-site:youtube.com", "example": "hacking tutorial -site:youtube.com"},
    {"operator": "|", "description": "OR logico", "syntax": "term1 | term2", "example": "\"sql injection\" | \"xss attack\""},
    {"operator": "..", "description": "Rango de numeros", "syntax": "1..100", "example": "\"CVE-2024\" 1..9999"},
    {"operator": "after:", "description": "Publicado despues de fecha", "syntax": "after:2024-01-01", "example": "vulnerability after:2024-01-01"},
    {"operator": "before:", "description": "Publicado antes de fecha", "syntax": "before:2023-01-01", "example": "data breach before:2023-01-01"},
    {"operator": "AROUND(n)", "description": "Palabras cercanas (n palabras de distancia)", "syntax": "word1 AROUND(5) word2", "example": "password AROUND(3) leaked"},
    {"operator": "allintitle:", "description": "Todas las palabras en titulo", "syntax": "allintitle:key1 key2", "example": "allintitle:admin panel login"},
    {"operator": "allinurl:", "description": "Todas las palabras en URL", "syntax": "allinurl:key1 key2", "example": "allinurl:admin config"},
    {"operator": "allintext:", "description": "Todas las palabras en texto", "syntax": "allintext:key1 key2", "example": "allintext:username password database"},
]

GOOGLE_DORKS = [
    # === SENSITIVE FILES ===
    {"id": "GD-001", "category": "Archivos Sensibles", "dork": 'intitle:"index of" "passwords.txt"', "description": "Archivos de contrasenas expuestos en directorios abiertos", "risk": "CRITICAL"},
    {"id": "GD-002", "category": "Archivos Sensibles", "dork": 'filetype:env "DB_PASSWORD"', "description": "Archivos .env con credenciales de bases de datos", "risk": "CRITICAL"},
    {"id": "GD-003", "category": "Archivos Sensibles", "dork": 'filetype:sql "INSERT INTO" "password"', "description": "Dumps SQL con datos de contrasenas", "risk": "CRITICAL"},
    {"id": "GD-004", "category": "Archivos Sensibles", "dork": 'filetype:log "password" | "username" | "login"', "description": "Archivos log con credenciales", "risk": "HIGH"},
    {"id": "GD-005", "category": "Archivos Sensibles", "dork": 'intitle:"index of" ".git"', "description": "Repositorios Git expuestos en servidores web", "risk": "CRITICAL"},
    {"id": "GD-006", "category": "Archivos Sensibles", "dork": 'filetype:cfg "password" | "passwd" | "secret"', "description": "Archivos de configuracion con secretos", "risk": "HIGH"},
    {"id": "GD-007", "category": "Archivos Sensibles", "dork": 'filetype:bak "password" | "database" | "config"', "description": "Archivos backup con informacion sensible", "risk": "HIGH"},
    {"id": "GD-008", "category": "Archivos Sensibles", "dork": 'intitle:"index of" "wp-config.php"', "description": "Configuracion de WordPress expuesta", "risk": "CRITICAL"},
    {"id": "GD-009", "category": "Archivos Sensibles", "dork": 'filetype:pem "PRIVATE KEY"', "description": "Claves privadas PEM expuestas", "risk": "CRITICAL"},
    {"id": "GD-010", "category": "Archivos Sensibles", "dork": 'filetype:ppk "PuTTY"', "description": "Claves privadas PuTTY expuestas", "risk": "CRITICAL"},

    # === ADMIN PANELS ===
    {"id": "GD-011", "category": "Paneles Admin", "dork": 'intitle:"admin" inurl:"login" | inurl:"admin"', "description": "Paneles de administracion expuestos", "risk": "HIGH"},
    {"id": "GD-012", "category": "Paneles Admin", "dork": 'inurl:"/phpmyadmin/" intitle:"phpMyAdmin"', "description": "phpMyAdmin accesible publicamente", "risk": "CRITICAL"},
    {"id": "GD-013", "category": "Paneles Admin", "dork": 'intitle:"Dashboard" inurl:"grafana"', "description": "Dashboards Grafana publicos", "risk": "HIGH"},
    {"id": "GD-014", "category": "Paneles Admin", "dork": 'intitle:"Kibana" inurl:"app/kibana"', "description": "Instancias Kibana expuestas", "risk": "HIGH"},
    {"id": "GD-015", "category": "Paneles Admin", "dork": 'intitle:"Jenkins" inurl:"/login"', "description": "Servidores Jenkins accesibles", "risk": "HIGH"},
    {"id": "GD-016", "category": "Paneles Admin", "dork": 'inurl:"/wp-admin/" intitle:"Log In"', "description": "Paneles admin de WordPress", "risk": "MEDIUM"},
    {"id": "GD-017", "category": "Paneles Admin", "dork": 'intitle:"Portainer" inurl:"portainer"', "description": "Paneles Portainer (Docker) expuestos", "risk": "HIGH"},
    {"id": "GD-018", "category": "Paneles Admin", "dork": 'intitle:"RabbitMQ Management"', "description": "Paneles RabbitMQ publicos", "risk": "HIGH"},

    # === CAMERAS / IoT ===
    {"id": "GD-019", "category": "Camaras / IoT", "dork": 'intitle:"webcamXP 5" | inurl:"lvappl.htm"', "description": "Camaras web publicas accesibles", "risk": "MEDIUM"},
    {"id": "GD-020", "category": "Camaras / IoT", "dork": 'inurl:"/view.shtml" intitle:"Network Camera"', "description": "Camaras de red sin proteccion", "risk": "MEDIUM"},
    {"id": "GD-021", "category": "Camaras / IoT", "dork": 'intitle:"Live View / - AXIS"', "description": "Camaras AXIS publicas", "risk": "MEDIUM"},
    {"id": "GD-022", "category": "Camaras / IoT", "dork": 'inurl:"ViewerFrame?Mode="', "description": "Camaras con viewer frames abiertos", "risk": "MEDIUM"},
    {"id": "GD-023", "category": "Camaras / IoT", "dork": 'intitle:"router" inurl:"status" "firmware"', "description": "Paneles de routers expuestos", "risk": "HIGH"},

    # === VULNERABLE SERVERS ===
    {"id": "GD-024", "category": "Servidores Vulnerables", "dork": 'inurl:"/proc/self/cwd"', "description": "Servidores web con directory traversal", "risk": "CRITICAL"},
    {"id": "GD-025", "category": "Servidores Vulnerables", "dork": 'intitle:"Apache Status" "Apache Server Status"', "description": "Paginas de estado Apache expuestas", "risk": "MEDIUM"},
    {"id": "GD-026", "category": "Servidores Vulnerables", "dork": '"PHP Version" intitle:"phpinfo()"', "description": "Paginas phpinfo() accesibles", "risk": "HIGH"},
    {"id": "GD-027", "category": "Servidores Vulnerables", "dork": 'intitle:"index of" "server-status"', "description": "Status de servidores Apache abiertos", "risk": "MEDIUM"},
    {"id": "GD-028", "category": "Servidores Vulnerables", "dork": '"Directory listing for /" intitle:"directory listing"', "description": "Listado de directorios habilitado", "risk": "MEDIUM"},

    # === DATABASE EXPOSURE ===
    {"id": "GD-029", "category": "Bases de Datos", "dork": 'intitle:"MongoDB" inurl:"28017"', "description": "Instancias MongoDB sin autenticacion", "risk": "CRITICAL"},
    {"id": "GD-030", "category": "Bases de Datos", "dork": 'intitle:"Elasticsearch" inurl:":9200"', "description": "Clusters Elasticsearch expuestos", "risk": "CRITICAL"},
    {"id": "GD-031", "category": "Bases de Datos", "dork": 'intitle:"CouchDB" inurl:"5984"', "description": "Bases CouchDB sin proteccion", "risk": "CRITICAL"},
    {"id": "GD-032", "category": "Bases de Datos", "dork": 'filetype:sql site:pastebin.com "password"', "description": "Dumps SQL en Pastebin", "risk": "CRITICAL"},

    # === API KEYS & TOKENS ===
    {"id": "GD-033", "category": "API Keys", "dork": '"AKIA" filetype:env | filetype:cfg | filetype:txt', "description": "AWS Access Keys expuestas en archivos", "risk": "CRITICAL"},
    {"id": "GD-034", "category": "API Keys", "dork": '"sk_live_" filetype:env | filetype:txt | filetype:log', "description": "Stripe Live Keys expuestas", "risk": "CRITICAL"},
    {"id": "GD-035", "category": "API Keys", "dork": '"AIza" filetype:env | filetype:json | filetype:cfg', "description": "Google API Keys en archivos de config", "risk": "HIGH"},
    {"id": "GD-036", "category": "API Keys", "dork": '"ghp_" | "gho_" | "ghu_" filetype:txt | filetype:env', "description": "GitHub tokens expuestos", "risk": "CRITICAL"},
    {"id": "GD-037", "category": "API Keys", "dork": '"SG." filetype:env | filetype:cfg', "description": "SendGrid API Keys", "risk": "HIGH"},
    {"id": "GD-038", "category": "API Keys", "dork": '"xoxb-" | "xoxp-" filetype:env | filetype:txt', "description": "Slack Tokens expuestos", "risk": "HIGH"},

    # === MEXICO SPECIFIC ===
    {"id": "GD-039", "category": "Mexico OSINT", "dork": 'site:gob.mx filetype:pdf "confidencial" | "reservado"', "description": "Documentos gubernamentales MX clasificados", "risk": "HIGH"},
    {"id": "GD-040", "category": "Mexico OSINT", "dork": 'site:gob.mx filetype:xls "curp" | "rfc" | "nomina"', "description": "Hojas de calculo gubernamentales MX con datos personales", "risk": "CRITICAL"},
    {"id": "GD-041", "category": "Mexico OSINT", "dork": 'site:gob.mx inurl:"login" | inurl:"admin"', "description": "Paneles admin gubernamentales MX", "risk": "HIGH"},
    {"id": "GD-042", "category": "Mexico OSINT", "dork": 'site:edu.mx filetype:sql | filetype:bak "password"', "description": "Datos educativos MX expuestos", "risk": "HIGH"},
    {"id": "GD-043", "category": "Mexico OSINT", "dork": '"CURP" filetype:xls | filetype:csv | filetype:pdf', "description": "Documentos con CURPs expuestas", "risk": "CRITICAL"},
    {"id": "GD-044", "category": "Mexico OSINT", "dork": '"RFC" "contribuyente" filetype:xls | filetype:csv', "description": "Datos fiscales RFC expuestos", "risk": "HIGH"},

    # === SOCIAL ENGINEERING ===
    {"id": "GD-045", "category": "Ingenieria Social", "dork": 'inurl:email.xls ext:xls', "description": "Listas de emails en archivos Excel", "risk": "MEDIUM"},
    {"id": "GD-046", "category": "Ingenieria Social", "dork": 'filetype:csv "email" "phone" "name"', "description": "CSVs con datos de contacto", "risk": "MEDIUM"},
    {"id": "GD-047", "category": "Ingenieria Social", "dork": 'intitle:"curriculum vitae" filetype:pdf', "description": "CVs expuestos publicamente", "risk": "LOW"},

    # === CLOUD STORAGE ===
    {"id": "GD-048", "category": "Cloud Storage", "dork": 'site:s3.amazonaws.com "index of"', "description": "Buckets S3 con listado de directorios", "risk": "HIGH"},
    {"id": "GD-049", "category": "Cloud Storage", "dork": 'site:blob.core.windows.net "index"', "description": "Azure Blob Storage publico", "risk": "HIGH"},
    {"id": "GD-050", "category": "Cloud Storage", "dork": 'site:storage.googleapis.com "index"', "description": "Google Cloud Storage publico", "risk": "HIGH"},
]


# ============================================================================
# ENDPOINTS
# ============================================================================

@dorks_router.get("/operators")
async def get_search_operators():
    """Get all Google advanced search operators"""
    return {
        "module": "Google Hacking Database - X=pi by Carbi",
        "total_operators": len(SEARCH_OPERATORS),
        "operators": SEARCH_OPERATORS,
        "timestamp": datetime.utcnow().isoformat()
    }


@dorks_router.get("/database")
async def get_dorks_database(
    category: Optional[str] = Query(None, description="Filter by category"),
    risk: Optional[str] = Query(None, description="Filter by risk level"),
    search: Optional[str] = Query(None, description="Search in dorks")
):
    """Get the Google Hacking Database with filters"""
    filtered = GOOGLE_DORKS

    if category:
        filtered = [d for d in filtered if category.lower() in d["category"].lower()]
    if risk:
        filtered = [d for d in filtered if d["risk"] == risk.upper()]
    if search:
        s = search.lower()
        filtered = [d for d in filtered if s in d["dork"].lower() or s in d["description"].lower()]

    categories = {}
    for d in GOOGLE_DORKS:
        cat = d["category"]
        if cat not in categories:
            categories[cat] = 0
        categories[cat] += 1

    return {
        "module": "Google Hacking Database - X=pi by Carbi",
        "source": "readloud/Google-Hacking-Database + exploit-db GHDB",
        "total_dorks": len(filtered),
        "categories": categories,
        "dorks": filtered,
        "risk_levels": {"CRITICAL": "Exposicion directa de datos sensibles", "HIGH": "Riesgo significativo", "MEDIUM": "Informacion util para reconocimiento", "LOW": "Informacion publica pero util"},
        "disclaimer": "Solo para investigacion de seguridad autorizada. Usar con responsabilidad.",
        "timestamp": datetime.utcnow().isoformat()
    }


@dorks_router.get("/categories")
async def get_dork_categories():
    """Get all dork categories with counts"""
    categories = {}
    for d in GOOGLE_DORKS:
        cat = d["category"]
        if cat not in categories:
            categories[cat] = {"count": 0, "risks": {}}
        categories[cat]["count"] += 1
        risk = d["risk"]
        categories[cat]["risks"][risk] = categories[cat]["risks"].get(risk, 0) + 1

    return {
        "total_categories": len(categories),
        "total_dorks": len(GOOGLE_DORKS),
        "categories": categories,
        "timestamp": datetime.utcnow().isoformat()
    }


@dorks_router.post("/build")
async def build_custom_dork(target: str = "", dork_type: str = "general"):
    """Build a custom Google Dork based on target and type"""
    if not target:
        raise HTTPException(status_code=400, detail="Target is required")

    templates = {
        "general": [
            f'site:{target}',
            f'site:{target} filetype:pdf | filetype:doc | filetype:xls',
            f'site:{target} inurl:admin | inurl:login',
            f'site:{target} "error" | "warning" | "exception"',
        ],
        "files": [
            f'site:{target} filetype:env',
            f'site:{target} filetype:sql',
            f'site:{target} filetype:log',
            f'site:{target} filetype:bak',
            f'site:{target} filetype:cfg | filetype:conf',
            f'site:{target} intitle:"index of"',
        ],
        "credentials": [
            f'site:{target} "password" | "passwd" | "credentials"',
            f'site:{target} filetype:env "DB_" | "API_" | "SECRET"',
            f'site:{target} "AKIA" | "sk_live" | "AIza"',
            f'site:{target} inurl:".git" | inurl:".svn"',
        ],
        "infrastructure": [
            f'site:{target} intitle:"Apache" | intitle:"nginx"',
            f'site:{target} "phpinfo()" | "server at"',
            f'site:{target} inurl:":8080" | inurl:":8443" | inurl:":3000"',
            f'site:{target} "powered by" | "running on"',
        ],
        "mexico": [
            f'site:{target} "CURP" | "RFC" | "INE"',
            f'site:{target} filetype:xls "nomina" | "empleados"',
            f'site:{target} "datos personales" | "informacion confidencial"',
            f'site:{target} inurl:transparencia',
        ],
    }

    dorks = templates.get(dork_type, templates["general"])

    return {
        "target": target,
        "dork_type": dork_type,
        "generated_dorks": dorks,
        "instructions": "Copia y pega estos dorks en Google para encontrar informacion publica expuesta.",
        "available_types": list(templates.keys()),
        "disclaimer": "Solo para investigacion de seguridad autorizada.",
        "timestamp": datetime.utcnow().isoformat()
    }
