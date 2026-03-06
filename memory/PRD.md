# X=pi by Carbi - PRD v8.1

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
├── red_team_ctf.py        # RED TEAM CTF (4 ejercicios, kill chain, leaderboard)
├── eye_mexico.py          # El Ojo del Diablo
└── .env                   # Keys
```

## Features implementadas
- C2 Malware Dashboard (8 agents, 4 plataformas, payload builder, labs, audit)
- Red Team CTF (4 ejercicios guiados kill chain, scoring, leaderboard)
- Training Platforms menu (12 plataformas con links directos via icono pirata)
- Push a GitHub: BlackFlag777solo/X-

## Testing: 116/116 tests passed (5 iterations)

## Google API Key: AIzaSyBmoW9lbG9YmlilcAeKiYei1gPtm4ilDMs

## Backlog
- P1: Refactorizar index.tsx (~3400 lineas) en componentes
