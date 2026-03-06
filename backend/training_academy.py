# ============================================================================
# TRAINING ACADEMY - X=pi by Carbi
# 12 Original AI-Powered Cybersecurity Training Programs
# ============================================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import os
import random
import hashlib
import json

academy_router = APIRouter(prefix="/api/academy", tags=["Training Academy"])

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# ============================================================================
# MODELS
# ============================================================================

class ChallengeAttempt(BaseModel):
    program_id: str
    level_id: str
    challenge_id: str
    user_input: str

class AIMentorRequest(BaseModel):
    program_id: str
    level_id: str
    challenge_id: str
    question: str

# ============================================================================
# 12 ORIGINAL PROGRAMS
# ============================================================================

PROGRAMS = [
    {
        "id": "shadowforge",
        "name": "ShadowForge",
        "icon": "anvil",
        "color": "#9fef00",
        "tagline": "Forja tus habilidades en la oscuridad",
        "category": "Hacking Labs",
        "difficulty": "ALL",
        "desc": "Laboratorio de hacking interactivo. Explota vulnerabilidades reales en sistemas simulados. Aprende atacando.",
        "levels": [
            {
                "id": "sf-1", "name": "Buffer Overflow Basics", "difficulty": "EASY", "xp": 50,
                "briefing": "Un servidor FTP tiene un buffer overflow en el campo USER. Explota la vulnerabilidad para obtener acceso root.",
                "challenges": [
                    {"id": "sf-1-1", "type": "terminal", "prompt": "Identifica el offset exacto del buffer overflow. El buffer es de 256 bytes. Que offset necesitas?", "answer": "260", "hint": "Buffer (256) + saved EBP (4) = offset al EIP", "points": 10},
                    {"id": "sf-1-2", "type": "terminal", "prompt": "Que registro controla la direccion de retorno despues del overflow?", "answer": "eip", "hint": "Extended Instruction Pointer - controla la siguiente instruccion a ejecutar", "points": 10},
                    {"id": "sf-1-3", "type": "code", "prompt": "Escribe el payload basico: python -c 'print(\"A\"*260 + \"\\xef\\xbe\\xad\\xde\")'. Cual es la direccion en little-endian?", "answer": "0xdeadbeef", "hint": "Lee los bytes en orden inverso: de ad be ef", "points": 15},
                ]
            },
            {
                "id": "sf-2", "name": "SQL Injection Chain", "difficulty": "MEDIUM", "xp": 100,
                "briefing": "Una aplicacion web bancaria es vulnerable a SQLi. Encadena multiples inyecciones para extraer datos criticos.",
                "challenges": [
                    {"id": "sf-2-1", "type": "terminal", "prompt": "La pagina de login es vulnerable. Que payload bypassa la autenticacion?", "answer": "' or 1=1--", "hint": "Necesitas cerrar la comilla y hacer la condicion siempre verdadera", "points": 15},
                    {"id": "sf-2-2", "type": "terminal", "prompt": "Enumera las tablas. Que clausula SQL usas para listar tablas en MySQL?", "answer": "information_schema.tables", "hint": "MySQL guarda metadata en information_schema", "points": 15},
                    {"id": "sf-2-3", "type": "terminal", "prompt": "Extrae el hash del admin. Que tipo de hash es: 5f4dcc3b5aa765d61d8327deb882cf99?", "answer": "md5", "hint": "32 caracteres hexadecimales = MD5", "points": 20},
                ]
            },
            {
                "id": "sf-3", "name": "Kernel Exploit", "difficulty": "HARD", "xp": 200,
                "briefing": "Tienes una shell como www-data en un servidor con kernel 4.15.0. Escala privilegios explotando el kernel.",
                "challenges": [
                    {"id": "sf-3-1", "type": "terminal", "prompt": "Que comando muestra la version exacta del kernel Linux?", "answer": "uname -r", "hint": "uname con la flag -r muestra la release del kernel", "points": 20},
                    {"id": "sf-3-2", "type": "terminal", "prompt": "Kernel 4.15.0 es vulnerable a DirtyCow. Que archivo del sistema permite escribir como root via esta vuln?", "answer": "/etc/passwd", "hint": "DirtyCow permite escribir en archivos de solo lectura. El archivo de usuarios es...", "points": 25},
                    {"id": "sf-3-3", "type": "terminal", "prompt": "Despues del exploit, creas un usuario root. Que UID tiene root en Linux?", "answer": "0", "hint": "El superusuario siempre tiene UID 0", "points": 25},
                ]
            }
        ]
    },
    {
        "id": "cybersprout",
        "name": "CyberSprout",
        "icon": "sprout",
        "color": "#88cc14",
        "tagline": "Tu primer paso en ciberseguridad",
        "category": "Beginner Training",
        "difficulty": "BEGINNER",
        "desc": "Programa de entrenamiento paso a paso para principiantes. Desde cero hasta tus primeros exploits.",
        "levels": [
            {
                "id": "cs-1", "name": "Fundamentos de Red", "difficulty": "EASY", "xp": 30,
                "briefing": "Aprende los conceptos basicos de redes que todo hacker necesita dominar.",
                "challenges": [
                    {"id": "cs-1-1", "type": "quiz", "prompt": "Que protocolo usa el puerto 443?", "answer": "https", "hint": "Es la version segura de HTTP", "points": 5},
                    {"id": "cs-1-2", "type": "quiz", "prompt": "Que herramienta se usa para escanear puertos abiertos en un objetivo?", "answer": "nmap", "hint": "Network Mapper - la herramienta mas famosa de escaneo", "points": 5},
                    {"id": "cs-1-3", "type": "quiz", "prompt": "Que significa TCP en redes?", "answer": "transmission control protocol", "hint": "Protocolo de Control de Transmision", "points": 5},
                    {"id": "cs-1-4", "type": "terminal", "prompt": "Que comando ping envia 4 paquetes a google.com en Linux?", "answer": "ping -c 4 google.com", "hint": "Usa la flag -c para contar paquetes", "points": 10},
                ]
            },
            {
                "id": "cs-2", "name": "Linux Basico para Hackers", "difficulty": "EASY", "xp": 40,
                "briefing": "Domina los comandos esenciales de Linux que usaras en cada operacion.",
                "challenges": [
                    {"id": "cs-2-1", "type": "terminal", "prompt": "Que comando lista archivos ocultos en Linux?", "answer": "ls -la", "hint": "ls con las flags -l (detalle) y -a (todos, incluyendo ocultos)", "points": 5},
                    {"id": "cs-2-2", "type": "terminal", "prompt": "Que comando busca la palabra 'password' en todos los archivos .txt?", "answer": "grep -r password *.txt", "hint": "grep busca patrones. -r es recursivo", "points": 10},
                    {"id": "cs-2-3", "type": "terminal", "prompt": "Que comando cambia permisos de un archivo a rwx para todos?", "answer": "chmod 777", "hint": "r=4, w=2, x=1. Todos los permisos = 7 para cada grupo", "points": 10},
                ]
            },
            {
                "id": "cs-3", "name": "Tu Primer Exploit", "difficulty": "EASY", "xp": 60,
                "briefing": "Realiza tu primer ataque controlado: un escaneo, una vulnerabilidad, y acceso.",
                "challenges": [
                    {"id": "cs-3-1", "type": "terminal", "prompt": "Escaneas el target y encuentras puerto 22 abierto. Que servicio corre normalmente en este puerto?", "answer": "ssh", "hint": "Secure Shell - acceso remoto seguro", "points": 10},
                    {"id": "cs-3-2", "type": "terminal", "prompt": "El password de root es 'toor'. Que comando usas para conectar via SSH?", "answer": "ssh root@target", "hint": "ssh usuario@host", "points": 10},
                    {"id": "cs-3-3", "type": "terminal", "prompt": "Ya dentro del sistema, que archivo contiene los hashes de passwords en Linux?", "answer": "/etc/shadow", "hint": "shadow es el archivo que guarda los hashes, no /etc/passwd", "points": 15},
                ]
            }
        ]
    },
    {
        "id": "wargrid",
        "name": "WarGrid",
        "icon": "chess-knight",
        "color": "#00ccff",
        "tagline": "Batalla estrategica en el ciberespacio",
        "category": "Wargames",
        "difficulty": "MEDIUM",
        "desc": "Wargames progresivos. Cada nivel desbloquea credenciales para el siguiente. Piensa como un estratega.",
        "levels": [
            {
                "id": "wg-1", "name": "Nivel 0: Reconocimiento", "difficulty": "EASY", "xp": 40,
                "briefing": "El password del siguiente nivel esta oculto en un archivo del sistema. Encuentralo.",
                "challenges": [
                    {"id": "wg-1-1", "type": "terminal", "prompt": "El password esta en un archivo llamado '-' en el home directory. Como lees un archivo que empieza con guion?", "answer": "cat ./-", "hint": "Usa ./ para indicar que es un archivo, no una flag", "points": 15},
                    {"id": "wg-1-2", "type": "terminal", "prompt": "El siguiente password esta en un archivo con espacios en el nombre: 'my file'. Como lo lees?", "answer": "cat 'my file'", "hint": "Usa comillas simples o dobles para nombres con espacios", "points": 10},
                ]
            },
            {
                "id": "wg-2", "name": "Nivel 1: Criptografia", "difficulty": "MEDIUM", "xp": 80,
                "briefing": "El password esta cifrado. Descifra el mensaje para avanzar.",
                "challenges": [
                    {"id": "wg-2-1", "type": "terminal", "prompt": "El texto 'Gur cnffjbeq vf plore' esta en ROT13. Que dice?", "answer": "the password is cyber", "hint": "ROT13 rota cada letra 13 posiciones. G->T, u->h, r->e...", "points": 15},
                    {"id": "wg-2-2", "type": "terminal", "prompt": "Decodifica este Base64: cGlyYXRl", "answer": "pirate", "hint": "Usa: echo cGlyYXRl | base64 -d", "points": 15},
                    {"id": "wg-2-3", "type": "terminal", "prompt": "Que hash algorithm produce exactamente 40 caracteres hexadecimales?", "answer": "sha1", "hint": "MD5=32, SHA1=40, SHA256=64", "points": 15},
                ]
            },
            {
                "id": "wg-3", "name": "Nivel 2: Esteganografia", "difficulty": "HARD", "xp": 120,
                "briefing": "El password esta oculto dentro de una imagen. Usa tecnicas de esteganografia.",
                "challenges": [
                    {"id": "wg-3-1", "type": "terminal", "prompt": "Que herramienta de linea de comandos extrae strings legibles de archivos binarios?", "answer": "strings", "hint": "El comando 'strings' extrae secuencias de caracteres ASCII", "points": 15},
                    {"id": "wg-3-2", "type": "terminal", "prompt": "Que herramienta popular de esteganografia oculta datos en imagenes?", "answer": "steghide", "hint": "steg + hide = herramienta para ocultar datos en imagenes", "points": 20},
                    {"id": "wg-3-3", "type": "terminal", "prompt": "Que comando de steghide extraes datos ocultos de una imagen?", "answer": "steghide extract -sf imagen.jpg", "hint": "extract para sacar datos, -sf para el archivo fuente", "points": 20},
                ]
            }
        ]
    },
    {
        "id": "ciphervault",
        "name": "CipherVault",
        "icon": "safe-square",
        "color": "#ffcc00",
        "tagline": "Descifra. Resuelve. Conquista.",
        "category": "Crypto Challenges",
        "difficulty": "ALL",
        "desc": "Desafios criptograficos desde cifrado clasico hasta criptografia moderna. Rompe cada boveda.",
        "levels": [
            {
                "id": "cv-1", "name": "Boveda Clasica", "difficulty": "EASY", "xp": 50,
                "briefing": "Descifra mensajes usando tecnicas clasicas de criptografia.",
                "challenges": [
                    {"id": "cv-1-1", "type": "crypto", "prompt": "Cifrado Cesar con desplazamiento 3: 'DWWDFN' se descifra como?", "answer": "attack", "hint": "Retrocede 3 letras: D->A, W->T, W->T, D->A, F->C, N->K", "points": 10},
                    {"id": "cv-1-2", "type": "crypto", "prompt": "En el cifrado Vigenere con clave 'KEY', que letra resulta de cifrar 'A'?", "answer": "k", "hint": "A + K = K (A es 0, K es 10)", "points": 15},
                    {"id": "cv-1-3", "type": "crypto", "prompt": "Que cifrado usa una matriz 5x5 y omite la letra J?", "answer": "playfair", "hint": "Inventado por Charles Wheatstone, popularizado por Lord Playfair", "points": 15},
                ]
            },
            {
                "id": "cv-2", "name": "Boveda Moderna", "difficulty": "MEDIUM", "xp": 100,
                "briefing": "Enfrenta desafios de criptografia moderna: hashing, AES, RSA.",
                "challenges": [
                    {"id": "cv-2-1", "type": "crypto", "prompt": "Que modo de AES NO debe usarse por ser inseguro (mismo plaintext = mismo ciphertext)?", "answer": "ecb", "hint": "Electronic Codebook - cada bloque se cifra identicamente", "points": 20},
                    {"id": "cv-2-2", "type": "crypto", "prompt": "En RSA, si p=3 y q=11, cual es n?", "answer": "33", "hint": "n = p * q = 3 * 11", "points": 15},
                    {"id": "cv-2-3", "type": "crypto", "prompt": "Que ataque explota el uso de e=3 pequeno en RSA con mensajes cortos?", "answer": "cube root", "hint": "Si m^3 < n, puedes simplemente calcular la raiz cubica", "points": 25},
                ]
            }
        ]
    },
    {
        "id": "phantomgate",
        "name": "PhantomGate",
        "icon": "ghost",
        "color": "#ff6600",
        "tagline": "Atraviesa las puertas invisibles",
        "category": "Classic Practice",
        "difficulty": "MEDIUM",
        "desc": "Desafios clasicos de hacking web. XSS, CSRF, authentication bypass, directory traversal.",
        "levels": [
            {
                "id": "pg-1", "name": "XSS Playground", "difficulty": "EASY", "xp": 50,
                "briefing": "Inyecta scripts en aplicaciones web vulnerables. Domina Cross-Site Scripting.",
                "challenges": [
                    {"id": "pg-1-1", "type": "web", "prompt": "Cual es el payload XSS mas basico para mostrar una alerta?", "answer": "<script>alert(1)</script>", "hint": "Etiqueta script con funcion alert()", "points": 10},
                    {"id": "pg-1-2", "type": "web", "prompt": "Si las etiquetas <script> estan filtradas, que evento HTML usas? Ejemplo: <img src=x onerror=...>", "answer": "onerror", "hint": "Eventos como onerror, onload, onmouseover ejecutan JS", "points": 15},
                    {"id": "pg-1-3", "type": "web", "prompt": "Que tipo de XSS se almacena en la base de datos del servidor?", "answer": "stored", "hint": "Reflected es temporal, Stored se guarda permanentemente", "points": 10},
                ]
            },
            {
                "id": "pg-2", "name": "Auth Bypass", "difficulty": "MEDIUM", "xp": 80,
                "briefing": "Bypassa mecanismos de autenticacion mal implementados.",
                "challenges": [
                    {"id": "pg-2-1", "type": "web", "prompt": "Un JWT tiene 3 partes separadas por punto. Cual es la primera parte?", "answer": "header", "hint": "Header.Payload.Signature", "points": 15},
                    {"id": "pg-2-2", "type": "web", "prompt": "Que algoritmo JWT puedes cambiar a 'none' para bypasear la verificacion?", "answer": "alg", "hint": "El campo 'alg' en el header define el algoritmo de firma", "points": 20},
                    {"id": "pg-2-3", "type": "web", "prompt": "Que vulnerabilidad permite acceder a /admin/../../../etc/passwd?", "answer": "path traversal", "hint": "Los ../ permiten navegar fuera del directorio raiz web", "points": 15},
                ]
            }
        ]
    },
    {
        "id": "flaghunter",
        "name": "FlagHunter",
        "icon": "flag-variant",
        "color": "#3ddc84",
        "tagline": "Captura cada bandera",
        "category": "CTF Training",
        "difficulty": "ALL",
        "desc": "Entrenamiento CTF con desafios de forensics, reversing, pwn, web y misc.",
        "levels": [
            {
                "id": "fh-1", "name": "Forensics 101", "difficulty": "EASY", "xp": 50,
                "briefing": "Analiza evidencia digital para encontrar las flags ocultas.",
                "challenges": [
                    {"id": "fh-1-1", "type": "forensic", "prompt": "Que comando muestra los metadatos EXIF de una imagen?", "answer": "exiftool", "hint": "exif + tool = la herramienta para metadatos", "points": 10},
                    {"id": "fh-1-2", "type": "forensic", "prompt": "Que herramienta analiza el trafico de red capturado en archivos .pcap?", "answer": "wireshark", "hint": "El tiburon de cables - analizador de protocolos de red", "points": 10},
                    {"id": "fh-1-3", "type": "forensic", "prompt": "En un volcado de memoria, que herramienta de Python se usa para analysis forense?", "answer": "volatility", "hint": "Volatile + framework = herramienta de memoria forense", "points": 15},
                ]
            },
            {
                "id": "fh-2", "name": "Reversing Basics", "difficulty": "MEDIUM", "xp": 80,
                "briefing": "Ingenieria inversa de binarios. Encuentra la logica oculta.",
                "challenges": [
                    {"id": "fh-2-1", "type": "reversing", "prompt": "Que herramienta open-source de la NSA se usa para ingenieria inversa?", "answer": "ghidra", "hint": "Creada por la NSA, liberada en 2019. Empieza con G", "points": 15},
                    {"id": "fh-2-2", "type": "reversing", "prompt": "Que comando de Linux muestra las llamadas al sistema de un programa?", "answer": "strace", "hint": "system + trace = seguimiento de llamadas al sistema", "points": 15},
                    {"id": "fh-2-3", "type": "reversing", "prompt": "En assembly x86, que instruccion compara dos valores?", "answer": "cmp", "hint": "compare - compara y establece flags para saltos condicionales", "points": 20},
                ]
            }
        ]
    },
    {
        "id": "bladepent",
        "name": "BladePentest",
        "icon": "sword-cross",
        "color": "#ff003c",
        "tagline": "El filo del pentester profesional",
        "category": "Pentest Labs",
        "difficulty": "ADVANCED",
        "desc": "Laboratorios de pentesting profesional. Metodologia completa: recon, enum, exploit, post-exploit.",
        "levels": [
            {
                "id": "bp-1", "name": "External Pentest", "difficulty": "MEDIUM", "xp": 100,
                "briefing": "Realiza un pentest externo completo contra una empresa ficticia.",
                "challenges": [
                    {"id": "bp-1-1", "type": "pentest", "prompt": "Que herramienta automatizada descubre subdominios de un dominio?", "answer": "subfinder", "hint": "sub + finder. Alternativas: amass, sublist3r", "points": 15},
                    {"id": "bp-1-2", "type": "pentest", "prompt": "Que flag de nmap realiza un escaneo de versiones de servicios?", "answer": "-sv", "hint": "s = scan, V = version detection", "points": 15},
                    {"id": "bp-1-3", "type": "pentest", "prompt": "Que framework de explotacion es el estandar de la industria para pentesting?", "answer": "metasploit", "hint": "El framework mas usado para explotar vulnerabilidades. Meta + sploit", "points": 10},
                ]
            },
            {
                "id": "bp-2", "name": "Active Directory Attack", "difficulty": "HARD", "xp": 200,
                "briefing": "Compromete un dominio Active Directory completo.",
                "challenges": [
                    {"id": "bp-2-1", "type": "pentest", "prompt": "Que herramienta grafica mapea relaciones y paths de ataque en AD?", "answer": "bloodhound", "hint": "Blood + hound = perro sabueso que rastrea paths de ataque", "points": 20},
                    {"id": "bp-2-2", "type": "pentest", "prompt": "Que ataque solicita tickets TGS para crackear passwords de cuentas de servicio?", "answer": "kerberoasting", "hint": "Kerberos + roasting = asar tickets de Kerberos", "points": 25},
                    {"id": "bp-2-3", "type": "pentest", "prompt": "Que tipo de ticket Kerberos forjado da acceso permanente a todo el dominio?", "answer": "golden ticket", "hint": "El ticket dorado - forjado con el hash de krbtgt", "points": 25},
                ]
            }
        ]
    },
    {
        "id": "strikehawk",
        "name": "StrikeHawk",
        "icon": "bird",
        "color": "#00bcd4",
        "tagline": "Precision letal en cada ataque",
        "category": "Advanced CTF",
        "difficulty": "HARD",
        "desc": "CTFs avanzados: heap exploitation, race conditions, kernel exploits, side-channel attacks.",
        "levels": [
            {
                "id": "sh-1", "name": "Heap Exploitation", "difficulty": "HARD", "xp": 150,
                "briefing": "Explota vulnerabilidades en el heap allocator de glibc.",
                "challenges": [
                    {"id": "sh-1-1", "type": "pwn", "prompt": "Que estructura usa glibc para manejar chunks libres en el heap?", "answer": "bins", "hint": "fastbins, smallbins, largebins, unsorted bin", "points": 25},
                    {"id": "sh-1-2", "type": "pwn", "prompt": "Que tecnica de heap overwrites el forward pointer de un fastbin chunk?", "answer": "fastbin dup", "hint": "Duplicar una entrada en el fastbin via double free", "points": 30},
                    {"id": "sh-1-3", "type": "pwn", "prompt": "Que proteccion de glibc verifica la integridad de chunks al hacer free()?", "answer": "safe linking", "hint": "Introducido en glibc 2.32, protege los fd pointers", "points": 30},
                ]
            }
        ]
    },
    {
        "id": "webwraith",
        "name": "WebWraith",
        "icon": "web",
        "color": "#aa00ff",
        "tagline": "Fantasma en la web",
        "category": "Web Pentesting",
        "difficulty": "MEDIUM",
        "desc": "Pentesting web avanzado: SSRF, XXE, SSTI, deserialization, API hacking.",
        "levels": [
            {
                "id": "ww-1", "name": "SSRF Mastery", "difficulty": "MEDIUM", "xp": 80,
                "briefing": "Explota Server-Side Request Forgery para acceder a servicios internos.",
                "challenges": [
                    {"id": "ww-1-1", "type": "web", "prompt": "Que URL usas en SSRF para acceder al servidor local? (esquema://host)", "answer": "http://127.0.0.1", "hint": "Localhost = 127.0.0.1 o tambien http://localhost", "points": 10},
                    {"id": "ww-1-2", "type": "web", "prompt": "En AWS, que IP del metadata service es objetivo comun de SSRF?", "answer": "169.254.169.254", "hint": "El endpoint de metadata de instancias AWS EC2", "points": 20},
                    {"id": "ww-1-3", "type": "web", "prompt": "Que esquema de URL permite leer archivos locales via SSRF?", "answer": "file://", "hint": "file:///etc/passwd por ejemplo", "points": 15},
                ]
            },
            {
                "id": "ww-2", "name": "SSTI Attack", "difficulty": "HARD", "xp": 120,
                "briefing": "Server-Side Template Injection. Inyecta codigo en motores de templates.",
                "challenges": [
                    {"id": "ww-2-1", "type": "web", "prompt": "Que payload basico detecta SSTI en Jinja2? (usa doble llave y una operacion)", "answer": "{{7*7}}", "hint": "Si el servidor responde 49, es vulnerable a SSTI", "points": 15},
                    {"id": "ww-2-2", "type": "web", "prompt": "En Jinja2 SSTI, que atributo de Python accede a las subclases de object?", "answer": "__subclasses__", "hint": "''.__class__.__mro__[1].__subclasses__()", "points": 25},
                    {"id": "ww-2-3", "type": "web", "prompt": "Que motor de templates de Node.js es comunmente vulnerable a SSTI?", "answer": "pug", "hint": "Anteriormente conocido como Jade", "points": 20},
                ]
            }
        ]
    },
    {
        "id": "cyberdrill",
        "name": "CyberDrill",
        "icon": "shield-alert",
        "color": "#ff4081",
        "tagline": "Simulacros de ciberataque real",
        "category": "Incident Response",
        "difficulty": "MEDIUM",
        "desc": "Simulacros de respuesta a incidentes. Ransomware, data breach, APT. Actua bajo presion.",
        "levels": [
            {
                "id": "cd-1", "name": "Ransomware Response", "difficulty": "MEDIUM", "xp": 100,
                "briefing": "Tu empresa fue atacada por ransomware. Contiene el ataque y recupera los sistemas.",
                "challenges": [
                    {"id": "cd-1-1", "type": "incident", "prompt": "Primer paso ante ransomware: aislar sistemas infectados. Que comando desconecta la red en Linux?", "answer": "ifconfig eth0 down", "hint": "ifconfig para configurar interfaces, down para desactivar", "points": 15},
                    {"id": "cd-1-2", "type": "incident", "prompt": "Que tipo de backup NO puede ser cifrado por ransomware si esta correctamente configurado?", "answer": "offline", "hint": "Si no esta conectado, no puede ser alcanzado. Backups desconectados/air-gapped", "points": 15},
                    {"id": "cd-1-3", "type": "incident", "prompt": "Que servicio gratuito ayuda a identificar y descifrar ransomware conocido?", "answer": "nomoreransom", "hint": "No More Ransom - proyecto de Europol y empresas de seguridad", "points": 20},
                ]
            },
            {
                "id": "cd-2", "name": "APT Investigation", "difficulty": "HARD", "xp": 150,
                "briefing": "Un APT lleva meses en tu red. Investiga, rastrea y elimina al adversario.",
                "challenges": [
                    {"id": "cd-2-1", "type": "incident", "prompt": "Que framework categoriza las tacticas y tecnicas de adversarios?", "answer": "mitre att&ck", "hint": "MITRE ATT&CK - la base de datos de tacticas adversarias", "points": 20},
                    {"id": "cd-2-2", "type": "incident", "prompt": "Que tipo de indicador es un hash SHA256 de un archivo malicioso? (IoC type)", "answer": "ioc", "hint": "Indicator of Compromise - evidencia de actividad maliciosa", "points": 15},
                    {"id": "cd-2-3", "type": "incident", "prompt": "Que herramienta SIEM open-source es popular para detection y response?", "answer": "wazuh", "hint": "Fork de OSSEC, plataforma de seguridad open source", "points": 25},
                ]
            }
        ]
    },
    {
        "id": "breachpoint",
        "name": "BreachPoint",
        "icon": "target-account",
        "color": "#ff5722",
        "tagline": "Encuentra el punto de quiebre",
        "category": "Advanced Pentest",
        "difficulty": "EXPERT",
        "desc": "Escenarios de pentest avanzado: pivoting, tunneling, evasion de defensas, post-explotacion.",
        "levels": [
            {
                "id": "bx-1", "name": "Network Pivoting", "difficulty": "HARD", "xp": 150,
                "briefing": "Desde una maquina comprometida, pivotea hacia la red interna.",
                "challenges": [
                    {"id": "bx-1-1", "type": "pentest", "prompt": "Que herramienta crea un proxy SOCKS para pivotar trafico a traves de una sesion SSH?", "answer": "ssh -d", "hint": "SSH Dynamic port forwarding con -D crea un proxy SOCKS", "points": 20},
                    {"id": "bx-1-2", "type": "pentest", "prompt": "Que herramienta permite crear tunnels TCP sobre casi cualquier protocolo?", "answer": "chisel", "hint": "Herramienta Go para TCP tunneling. Muy usada en CTFs", "points": 25},
                    {"id": "bx-1-3", "type": "pentest", "prompt": "Que tecnica permite bypassear firewalls encapsulando trafico en DNS queries?", "answer": "dns tunneling", "hint": "Encapsular datos en consultas DNS para exfiltrar o tunelar", "points": 25},
                ]
            }
        ]
    },
    {
        "id": "blueshield",
        "name": "BlueShield",
        "icon": "shield-check",
        "color": "#2196f3",
        "tagline": "Defiende. Detecta. Responde.",
        "category": "Blue Team",
        "difficulty": "MEDIUM",
        "desc": "Entrenamiento defensivo: deteccion de intrusiones, analisis de logs, hardening, threat hunting.",
        "levels": [
            {
                "id": "bs-1", "name": "Log Analysis", "difficulty": "EASY", "xp": 50,
                "briefing": "Analiza logs de servidor para detectar actividad sospechosa.",
                "challenges": [
                    {"id": "bs-1-1", "type": "defense", "prompt": "En que archivo de Linux se registran los intentos fallidos de login?", "answer": "/var/log/auth.log", "hint": "auth.log en Debian/Ubuntu, secure en RedHat/CentOS", "points": 10},
                    {"id": "bs-1-2", "type": "defense", "prompt": "Que codigo HTTP indica un intento de acceso no autorizado?", "answer": "401", "hint": "4xx son errores del cliente. 401 = Unauthorized", "points": 10},
                    {"id": "bs-1-3", "type": "defense", "prompt": "Que herramienta bloquea IPs automaticamente despues de N intentos fallidos de login?", "answer": "fail2ban", "hint": "fail + 2 + ban = banea despues de fallos", "points": 15},
                ]
            },
            {
                "id": "bs-2", "name": "System Hardening", "difficulty": "MEDIUM", "xp": 80,
                "briefing": "Fortifica un servidor Linux aplicando las mejores practicas de seguridad.",
                "challenges": [
                    {"id": "bs-2-1", "type": "defense", "prompt": "Que directiva en sshd_config deshabilita el login de root por SSH?", "answer": "permitrootlogin no", "hint": "PermitRootLogin en /etc/ssh/sshd_config", "points": 15},
                    {"id": "bs-2-2", "type": "defense", "prompt": "Que firewall de Linux usa tablas y cadenas (INPUT, OUTPUT, FORWARD)?", "answer": "iptables", "hint": "ip + tables = el firewall clasico de Linux", "points": 15},
                    {"id": "bs-2-3", "type": "defense", "prompt": "Que herramienta escanea un sistema Linux buscando rootkits?", "answer": "rkhunter", "hint": "rootkit + hunter = cazador de rootkits", "points": 20},
                ]
            }
        ]
    }
]

# ============================================================================
# ENDPOINTS
# ============================================================================

@academy_router.get("/programs")
async def list_programs():
    programs = []
    for p in PROGRAMS:
        total_xp = sum(l["xp"] for l in p["levels"])
        total_challenges = sum(len(l["challenges"]) for l in p["levels"])
        programs.append({
            "id": p["id"], "name": p["name"], "icon": p["icon"], "color": p["color"],
            "tagline": p["tagline"], "category": p["category"], "difficulty": p["difficulty"],
            "desc": p["desc"], "levels": len(p["levels"]), "total_xp": total_xp,
            "total_challenges": total_challenges,
        })
    return {
        "programs": programs,
        "total": len(programs),
        "total_xp": sum(sum(l["xp"] for l in p["levels"]) for p in PROGRAMS),
        "total_challenges": sum(sum(len(l["challenges"]) for l in p["levels"]) for p in PROGRAMS),
    }


@academy_router.get("/program/{program_id}")
async def get_program(program_id: str):
    prog = next((p for p in PROGRAMS if p["id"] == program_id), None)
    if not prog:
        raise HTTPException(404, "Program not found")
    levels = []
    for l in prog["levels"]:
        levels.append({
            "id": l["id"], "name": l["name"], "difficulty": l["difficulty"], "xp": l["xp"],
            "briefing": l["briefing"], "challenges": len(l["challenges"]),
        })
    return {**{k: v for k, v in prog.items() if k != "levels"}, "levels": levels,
            "total_xp": sum(l["xp"] for l in prog["levels"]),
            "total_challenges": sum(len(l["challenges"]) for l in prog["levels"])}


@academy_router.get("/program/{program_id}/level/{level_id}")
async def get_level(program_id: str, level_id: str):
    prog = next((p for p in PROGRAMS if p["id"] == program_id), None)
    if not prog:
        raise HTTPException(404, "Program not found")
    level = next((l for l in prog["levels"] if l["id"] == level_id), None)
    if not level:
        raise HTTPException(404, "Level not found")
    challenges = []
    for c in level["challenges"]:
        challenges.append({"id": c["id"], "type": c["type"], "prompt": c["prompt"], "points": c["points"]})
    return {"program": prog["name"], "color": prog["color"], **level, "challenges": challenges}


@academy_router.post("/submit")
async def submit_answer(attempt: ChallengeAttempt):
    prog = next((p for p in PROGRAMS if p["id"] == attempt.program_id), None)
    if not prog:
        raise HTTPException(404, "Program not found")
    level = next((l for l in prog["levels"] if l["id"] == attempt.level_id), None)
    if not level:
        raise HTTPException(404, "Level not found")
    challenge = next((c for c in level["challenges"] if c["id"] == attempt.challenge_id), None)
    if not challenge:
        raise HTTPException(404, "Challenge not found")

    user_clean = attempt.user_input.strip().lower()
    answer_clean = challenge["answer"].strip().lower()
    correct = user_clean == answer_clean

    return {
        "correct": correct,
        "points": challenge["points"] if correct else 0,
        "answer": challenge["answer"] if not correct else None,
        "hint": challenge["hint"] if not correct else None,
        "message": random.choice([
            "Excelente! Sigues avanzando.", "Correcto! Nivel de elite.",
            "Perfecto! Un verdadero hacker.", "Bien hecho, operador."
        ]) if correct else random.choice([
            "Incorrecto. Revisa tu respuesta.", "No es la respuesta. Intenta de nuevo.",
            "Casi! Piensa diferente.", "Error. Usa la pista si necesitas ayuda."
        ]),
    }


@academy_router.post("/ai-mentor")
async def ai_mentor(req: AIMentorRequest):
    prog = next((p for p in PROGRAMS if p["id"] == req.program_id), None)
    if not prog:
        raise HTTPException(404, "Program not found")
    level = next((l for l in prog["levels"] if l["id"] == req.level_id), None)
    if not level:
        raise HTTPException(404, "Level not found")
    challenge = next((c for c in level["challenges"] if c["id"] == req.challenge_id), None)
    if not challenge:
        raise HTTPException(404, "Challenge not found")

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, system_message=f"""Eres un mentor de ciberseguridad experto en {prog['category']}. 
El estudiante esta en el nivel '{level['name']}' del programa '{prog['name']}'.
Desafio actual: {challenge['prompt']}
La respuesta correcta es: {challenge['answer']}
Hint oficial: {challenge['hint']}

Da pistas educativas sin revelar la respuesta directa. Se conciso (max 2-3 oraciones). Responde en espanol."""
        ).with_model("openai", "gpt-4o")
        response = await chat.send_message(UserMessage(content=req.question))
        return {"mentor_response": response.content, "program": prog["name"], "level": level["name"]}
    except Exception as e:
        return {
            "mentor_response": f"Pista: {challenge['hint']}. Analiza el contexto del desafio y piensa en las herramientas que conoces.",
            "program": prog["name"], "level": level["name"], "fallback": True
        }
