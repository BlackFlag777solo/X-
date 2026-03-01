# X=pi by Carbi - PRD v6.0

## Problema Original
Dashboard de ciberseguridad movil con estetica cyberpunk/hacker. App Expo (React Native) + FastAPI.

## Arquitectura
```
/app
├── backend/
│   ├── server.py             # Main FastAPI - registra todos los routers
│   ├── cellular_intel.py     # Inteligencia Celular (mocked, 11 endpoints)
│   ├── real_apis.py          # APIs Reales Live (Shodan, HIBP, Weather, SSL, Safe Browsing)
│   ├── secret_scanner.py     # Escaner de Secretos (68 patrones, 25 keyhacks)
│   ├── google_dorks.py       # Google Hacking Database (50 dorks, 22 operadores)
│   ├── mexico_osint.py       # Mexico OSINT v2 (32 estados, CURP, RFC, Telecom)
│   ├── pentest_lab.py        # NEW: Pentesting Lab (ians) - 11 endpoints simulados
│   ├── eye_mexico.py         # El Ojo del Diablo (mocked)
│   ├── .env                  # GOOGLE_API_KEY, MONGO_URL
│   └── requirements.txt
└── frontend/
    └── app/
        └── index.tsx         # Single-file Expo app (~2400+ lines)
```

## MODULOS COMPLETOS (8 modulos, 60+ endpoints)

### 1. Core Tools (server.py)
- OSINT Scanner, Password Check, Website Analyzer, AI Chat, Intel, Defense

### 2. El Ojo del Diablo (eye_mexico.py)
- Deep Search, Global Map, Breach Intel, Domain Intel

### 3. Cellular Intelligence (cellular_intel.py)
- 11 endpoints: Dashboard, Scan, SDR, Protocols, Attacks, IMSI, SS7, etc.

### 4. Real APIs (real_apis.py) - DATOS EN VIVO
- Shodan InternetDB, HaveIBeenPwned, SSL/TLS, Weather, Safe Browsing, URLHaus

### 5. Secret Scanner (secret_scanner.py) - keyhacks + secret-regex-list
- 68 regex patterns para detectar API keys (AWS, Google, Stripe, GitHub, etc.)
- 25 metodos KeyHacks para verificar keys filtradas
- 9 categorias: Cloud, Payment, Social, Dev, Email, Monitoring, SaaS, Crypto, Generic

### 6. Google Dorks (google_dorks.py) - Google-Hacking-Database
- 50 dorks por categoria (Archivos, Admin, Camaras, Servidores, DBs, API Keys, Mexico)
- 22 operadores avanzados de busqueda
- Constructor de dorks personalizado (5 tipos)

### 7. Mexico OSINT v2 (mexico_osint.py) - mexico-database + mexico_zipcodes
- 32 estados con datos completos (poblacion, area, capital, region, LADA)
- 20 ciudades principales con coordenadas
- Buscador de codigos postales
- Validador y decodificador de CURP
- Validador y decodificador de RFC
- 8 operadores telecom con cobertura

### 8. Pentesting Lab (pentest_lab.py) - giovanni-iannaccone/ians
- 6 targets simulados: Web, DB, Firewall, Mail, IoT, Windows AD
- Port Scanner (simula escaneo de puertos con CVEs)
- Network Sniffer (captura paquetes simulados TCP/UDP/DNS/HTTP)
- SSH Bruteforce (ataque simulado con wordlist)
- Exploit Framework (10 exploits con ejecucion paso a paso)
- Trojan Analyzer (8 templates: RAT, Keylogger, Ransomware, etc.)
- Site Mapper (mapeo de directorios web)
- User Recon (busqueda en 20 plataformas)

## Testing
- iteration_1.json: 23/23 passed (secrets, dorks, mexico, real_apis)
- iteration_2.json: 21/21 passed (pentest lab + regression all modules)
- Total: 44/44 tests passed

## Problemas Conocidos
- Google Safe Browsing: 403 (API no habilitada en Google Cloud del usuario)
- Google Gemini: 429 (cuota agotada)

## Backlog
- P2: Push to GitHub
- P2: Refactorizar index.tsx en componentes
- P3: Agregar mas APIs reales
