# X=pi by Carbi - PRD

## Problema Original
Dashboard de ciberseguridad movil con estetica cyberpunk/hacker. App Expo (React Native) + FastAPI.

## Arquitectura
```
/app
├── backend/
│   ├── server.py             # Main FastAPI - registra todos los routers
│   ├── cellular_intel.py     # Modulo Inteligencia Celular (mocked)
│   ├── real_apis.py          # APIs Reales (Shodan, HIBP, Weather, SSL, Safe Browsing)
│   ├── secret_scanner.py     # NEW: Escaner de secretos (68 patrones, 25 keyhacks)
│   ├── google_dorks.py       # NEW: Google Hacking Database (50 dorks, 22 operadores)
│   ├── mexico_osint.py       # NEW: Mexico OSINT v2 (32 estados, CURP, RFC, Telecom)
│   ├── eye_mexico.py         # El Ojo del Diablo (mocked)
│   ├── .env                  # GOOGLE_API_KEY, MONGO_URL
│   └── requirements.txt
└── frontend/
    └── app/
        └── index.tsx         # Single-file Expo app (~1800 lines)
```

## Modulos Implementados

### Backend - 6 Modulos
1. **Core Tools** (server.py): OSINT, Password, Website, AI Chat, Intel, Defense
2. **El Ojo del Diablo** (eye_mexico.py): Deep Search, Global Map, Breach Intel
3. **Cellular Intelligence** (cellular_intel.py): 11 endpoints mocked
4. **Real APIs** (real_apis.py): Shodan, HIBP, SSL, Weather, Safe Browsing, etc.
5. **Secret Scanner** (secret_scanner.py): 68 regex patterns, 25 KeyHacks, scan text for secrets
6. **Google Dorks** (google_dorks.py): 50 dorks, 22 operadores, constructor de dorks
7. **Mexico OSINT v2** (mexico_osint.py): 32 estados, ciudades, C.P., CURP, RFC, Telecom

### Frontend - Tabs
- Home, OSINT, Password, Website, AI Chat, Intel, Defense
- El Ojo del Diablo (sub-tabs: Search, Map, Breach, Domain)
- Cellular Intel (sub-tabs: Dashboard, Tools, Hardware, Attacks, Scan, Mexico)
- Secret Scanner (sub-tabs: Scanner, Patterns, KeyHacks)
- Google Dorks (sub-tabs: Database, Operators, Builder)
- Mexico OSINT v2 (sub-tabs: Dashboard, States, Cities, C.P., CURP, Telecom)
- APIs Reales (sub-tabs: Shodan, Breach, SSL, Weather, Safe Browse)

## Problemas Conocidos
- Google Safe Browsing API: 403 (API no habilitada en Google Cloud)
- Google Gemini API: 429 (cuota agotada)
- Ambos son problemas de configuracion de la API key del usuario

## Datos Repositorios Integrados
1. streaak/keyhacks -> Secret Scanner (keyhacks endpoint)
2. h33tlit/secret-regex-list -> Secret Scanner (68 patterns)
3. readloud/Google-Hacking-Database -> Google Dorks (50 dorks)
4. Heriberto-Juarez/mexico-database -> Mexico OSINT v2 (32 estados)
5. mexico_zipcodes -> Mexico OSINT v2 (rangos CP)

## Testing
- Backend: 23/23 tests passed (iteration_1.json)
- Test file: /app/backend/tests/test_new_modules.py

## Backlog
- P2: Push to GitHub
- P2: Refactorizar index.tsx en componentes separados
- P3: Agregar mas APIs reales al modulo Real APIs
