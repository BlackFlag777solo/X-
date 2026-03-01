# X=pi by Carbi - PRD v6.1

## Problema Original
Dashboard de ciberseguridad movil con estetica cyberpunk. Expo (React Native) + FastAPI.

## Arquitectura (10 modulos backend, 80+ endpoints)
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
├── eye_mexico.py        # El Ojo del Diablo
└── .env                 # Keys
```

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

## Testing: 65/65 tests passed (3 iterations)
- iteration_1: 23/23 (secrets, dorks, mexico, real_apis)
- iteration_2: 21/21 (pentest lab + regression)
- iteration_3: 21/21 (cyber tools funcionales)

## Backlog
- P2: Push to GitHub
- P2: Refactorizar index.tsx
