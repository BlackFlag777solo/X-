# X=pi by Carbi - PRD v8.0

## Problema Original
Dashboard de ciberseguridad movil con estetica cyberpunk. Expo (React Native) + FastAPI.

## Arquitectura (13 modulos backend, 100+ endpoints)
```
/app/backend/
├── server.py              # Main FastAPI
├── cellular_intel.py      # Inteligencia Celular (mocked)
├── real_apis.py           # APIs Reales Live (Shodan, HIBP, Weather, SSL)
├── secret_scanner.py      # Escaner de Secretos (68 patterns, 25 keyhacks)
├── google_dorks.py        # Google Hacking Database (50 dorks)
├── mexico_osint.py        # Mexico OSINT v2 (32 estados, CURP, RFC)
├── pentest_lab.py         # Pentesting Lab simulado (ians)
├── cyber_tools.py         # CYBER TOOLS FUNCIONALES (14 herramientas reales)
├── malware_c2.py          # C2 DASHBOARD (8 agents, 16 payloads, 4 labs)
├── red_team_ctf.py        # RED TEAM CTF (4 ejercicios, kill chain, leaderboard) - NEW
├── eye_mexico.py          # El Ojo del Diablo
└── .env                   # Keys (GOOGLE_API_KEY updated x2)
```

## NUEVO: Red Team CTF (red_team_ctf.py)
| Endpoint | Funcion |
|----------|---------|
| GET /api/ctf/exercises | Lista 4 ejercicios con dificultad y puntos |
| GET /api/ctf/exercise/{id} | Detalle completo del ejercicio con pasos |
| POST /api/ctf/start | Inicia ejercicio, retorna primer paso |
| POST /api/ctf/execute | Ejecuta paso actual, retorna output simulado |
| GET /api/ctf/leaderboard | Ranking de 7 operadores |

### Ejercicios disponibles:
| ID | Nombre | Dificultad | Puntos |
|----|--------|-----------|--------|
| EX-001 | Operation Shadow Entry | BEGINNER | 100 |
| EX-002 | Operation Mobile Ghost | INTERMEDIATE | 200 |
| EX-003 | Operation Domain Domination | ADVANCED | 500 |
| EX-004 | Operation iOS Zero-Day | EXPERT | 750 |

## C2 Malware Dashboard (malware_c2.py)
- 8 agentes simulados (Windows/Linux/Android/iOS)
- 16 payloads, 4 labs, payload builder, audit log

## Testing: 116/116 tests passed (5 iterations)
- iteration_1: 23/23 (secrets, dorks, mexico, real_apis)
- iteration_2: 21/21 (pentest lab + regression)
- iteration_3: 21/21 (cyber tools funcionales)
- iteration_4: 28/28 (C2 dashboard)
- iteration_5: 23/23 (Red Team CTF)

## Google API Key
- Current: AIzaSyBmoW9lbG9YmlilcAeKiYei1gPtm4ilDMs
- Safe Browsing: Requiere habilitacion en Google Cloud
- Gemini: Requiere verificar cuota

## Backlog
- P1: Refactorizar index.tsx (~3200 lineas) en componentes
- P2: Push to GitHub (usuario necesita token de acceso personal)
