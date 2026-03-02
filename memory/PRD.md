# X=pi by Carbi - PRD v7.0

## Problema Original
Dashboard de ciberseguridad movil con estetica cyberpunk. Expo (React Native) + FastAPI.

## Arquitectura (11 modulos backend, 90+ endpoints)
```
/app/backend/
├── server.py            # Main FastAPI
├── cellular_intel.py    # Inteligencia Celular (11 endpoints, mocked)
├── real_apis.py         # APIs Reales Live (Shodan, HIBP, Weather, SSL)
├── secret_scanner.py    # Escaner de Secretos (68 patterns, 25 keyhacks)
├── google_dorks.py      # Google Hacking Database (50 dorks)
├── mexico_osint.py      # Mexico OSINT v2 (32 estados, CURP, RFC)
├── pentest_lab.py       # Pentesting Lab simulado (ians)
├── cyber_tools.py       # CYBER TOOLS FUNCIONALES (14 herramientas reales)
├── malware_c2.py        # C2 DASHBOARD (8 agents, 16 payloads, 4 labs) - NEW
├── eye_mexico.py        # El Ojo del Diablo
└── .env                 # Keys (GOOGLE_API_KEY updated)
```

## NUEVO: C2 Malware Dashboard (malware_c2.py)
| Endpoint | Funcion |
|----------|---------|
| GET /api/c2/dashboard | Panel general con stats |
| GET /api/c2/agents | Lista todos los agentes (filtro por plataforma/status) |
| GET /api/c2/agent/{id} | Detalle de agente + comandos disponibles |
| POST /api/c2/agent/{id}/task | Ejecutar comando en agente |
| GET /api/c2/payloads | Catalogo de payloads por plataforma |
| POST /api/c2/build | Builder de payloads (simulado) |
| GET /api/c2/lab/environments | 4 labs simulados |
| GET /api/c2/audit | Log de auditoria |
| POST /api/c2/audit/log | Agregar entrada manual |
| GET /api/c2/commands/{platform} | Comandos por plataforma |

## HERRAMIENTAS FUNCIONALES (cyber_tools.py) - NO INFORMATIVAS
| Tool | Endpoint | Funcion REAL |
|------|----------|-------------|
| Port Scanner | POST /api/tools/port-scan | Escanea puertos TCP reales |
| DNS Lookup | POST /api/tools/dns-lookup | Resuelve DNS A/MX/NS/TXT |
| WHOIS | POST /api/tools/whois | Consulta WHOIS real |
| Hash Generator | POST /api/tools/hash | Genera MD5/SHA1/SHA256/SHA512 |
| Hash Cracker | POST /api/tools/crack-hash | Ataque diccionario real |
| Encoder/Decoder | POST /api/tools/encode | Base64/Hex/URL/ROT13/Binary/Morse |
| JWT Decoder | POST /api/tools/jwt-decode | Decodifica JWT reales |
| Password Gen | POST /api/tools/password-gen | Genera passwords criptograficos |
| Password Check | POST /api/tools/password-check | Analiza fuerza con entropia |
| Subnet Calc | POST /api/tools/subnet | Calcula subredes IP |
| HTTP Headers | POST /api/tools/http-headers | Inspecciona headers reales |
| TCP Ping | POST /api/tools/ping | Ping TCP real |
| Reverse IP | POST /api/tools/reverse-ip | Reverse DNS real |

## Testing: 93/93 tests passed (4 iterations)
- iteration_1: 23/23 (secrets, dorks, mexico, real_apis)
- iteration_2: 21/21 (pentest lab + regression)
- iteration_3: 21/21 (cyber tools funcionales)
- iteration_4: 28/28 (C2 dashboard + frontend)

## Google API Key
- Updated to: AIzaSyBmoW9lbG9YmlilcAeKiYei1gPtm4ilDMs
- Safe Browsing: Requiere habilitacion en Google Cloud
- Gemini: Requiere verificar cuota

## Backlog
- P1: Refactorizar index.tsx (~3000 lineas) en componentes
- P2: Push to GitHub (necesita token de acceso personal)
