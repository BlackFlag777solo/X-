"""
Test suite for Malware C2 Dashboard module - X=pi by Carbi
Tests all /api/c2/* endpoints for the simulated C2 control panel
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://hacker-c2-lab.preview.emergentagent.com')

class TestC2Dashboard:
    """C2 Dashboard main endpoint tests"""
    
    def test_c2_dashboard_overview(self):
        """GET /api/c2/dashboard - returns total_agents, active_agents, dormant_agents, platforms, total_payloads"""
        response = requests.get(f"{BASE_URL}/api/c2/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields
        assert data["total_agents"] == 8
        assert data["active_agents"] == 6
        assert data["dormant_agents"] == 2
        assert data["total_payloads"] == 16
        assert "platforms" in data
        assert data["platforms"]["windows"] == 2
        assert data["platforms"]["linux"] == 2
        assert data["platforms"]["android"] == 2
        assert data["platforms"]["ios"] == 2
        assert data["environment"] == "SIMULATED LAB"
        print(f"✓ Dashboard: {data['total_agents']} agents ({data['active_agents']} active, {data['dormant_agents']} dormant), {data['total_payloads']} payloads")


class TestC2Agents:
    """C2 Agent list and filter tests"""
    
    def test_get_all_agents(self):
        """GET /api/c2/agents - returns all 8 agents with platform, status, hostname, ip, etc"""
        response = requests.get(f"{BASE_URL}/api/c2/agents")
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 8
        assert len(data["agents"]) == 8
        
        # Verify agent structure
        agent = data["agents"][0]
        assert "id" in agent
        assert "platform" in agent
        assert "status" in agent
        assert "hostname" in agent
        assert "ip" in agent
        assert "user" in agent
        assert "implant" in agent
        print(f"✓ All agents: {data['total']} agents retrieved")
    
    def test_filter_agents_by_windows(self):
        """GET /api/c2/agents?platform=windows - filters agents by platform"""
        response = requests.get(f"{BASE_URL}/api/c2/agents?platform=windows")
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 2
        assert all(a["platform"] == "windows" for a in data["agents"])
        print(f"✓ Windows filter: {data['total']} Windows agents")
    
    def test_filter_agents_by_android(self):
        """GET /api/c2/agents?platform=android - filters agents by platform"""
        response = requests.get(f"{BASE_URL}/api/c2/agents?platform=android")
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 2
        assert all(a["platform"] == "android" for a in data["agents"])
        print(f"✓ Android filter: {data['total']} Android agents")
    
    def test_filter_agents_by_linux(self):
        """GET /api/c2/agents?platform=linux - filters agents by linux"""
        response = requests.get(f"{BASE_URL}/api/c2/agents?platform=linux")
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 2
        assert all(a["platform"] == "linux" for a in data["agents"])
        print(f"✓ Linux filter: {data['total']} Linux agents")
    
    def test_filter_agents_by_ios(self):
        """GET /api/c2/agents?platform=ios - filters agents by ios"""
        response = requests.get(f"{BASE_URL}/api/c2/agents?platform=ios")
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 2
        assert all(a["platform"] == "ios" for a in data["agents"])
        print(f"✓ iOS filter: {data['total']} iOS agents")


class TestC2AgentDetail:
    """C2 Agent detail endpoint tests"""
    
    def test_get_windows_agent_detail(self):
        """GET /api/c2/agent/AGT-W001 - returns agent detail with available_commands"""
        response = requests.get(f"{BASE_URL}/api/c2/agent/AGT-W001")
        assert response.status_code == 200
        data = response.json()
        
        assert data["agent"]["id"] == "AGT-W001"
        assert data["agent"]["platform"] == "windows"
        assert "available_commands" in data
        assert len(data["available_commands"]) > 0
        assert "screenshot" in data["available_commands"]
        assert "mimikatz" in data["available_commands"]
        print(f"✓ Agent AGT-W001: {data['command_count']} commands available")
    
    def test_get_android_agent_detail(self):
        """GET /api/c2/agent/AGT-A001 - returns android agent detail"""
        response = requests.get(f"{BASE_URL}/api/c2/agent/AGT-A001")
        assert response.status_code == 200
        data = response.json()
        
        assert data["agent"]["id"] == "AGT-A001"
        assert data["agent"]["platform"] == "android"
        assert "gps" in data["available_commands"]
        assert "sms_dump" in data["available_commands"]
        print(f"✓ Agent AGT-A001 (Android): {data['command_count']} commands available")
    
    def test_get_linux_agent_detail(self):
        """GET /api/c2/agent/AGT-L001 - returns linux agent detail"""
        response = requests.get(f"{BASE_URL}/api/c2/agent/AGT-L001")
        assert response.status_code == 200
        data = response.json()
        
        assert data["agent"]["id"] == "AGT-L001"
        assert data["agent"]["platform"] == "linux"
        assert "shell" in data["available_commands"]
        print(f"✓ Agent AGT-L001 (Linux): {data['command_count']} commands available")
    
    def test_get_nonexistent_agent(self):
        """GET /api/c2/agent/INVALID - returns 404"""
        response = requests.get(f"{BASE_URL}/api/c2/agent/INVALID")
        assert response.status_code == 404


class TestC2Tasks:
    """C2 Task execution tests"""
    
    def test_execute_screenshot_on_windows(self):
        """POST /api/c2/agent/AGT-W001/task with {agent_id: 'AGT-W001', command: 'screenshot'} - executes command"""
        response = requests.post(f"{BASE_URL}/api/c2/agent/AGT-W001/task", json={
            "agent_id": "AGT-W001",
            "command": "screenshot"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["agent_id"] == "AGT-W001"
        assert data["command"] == "screenshot"
        assert data["status"] == "completed"
        assert "result" in data
        assert "output" in data["result"]
        print(f"✓ Screenshot on AGT-W001: {data['result']['output'][:50]}...")
    
    def test_execute_shell_on_linux(self):
        """POST /api/c2/agent/AGT-L001/task with {agent_id: 'AGT-L001', command: 'shell'} - executes command"""
        response = requests.post(f"{BASE_URL}/api/c2/agent/AGT-L001/task", json={
            "agent_id": "AGT-L001",
            "command": "shell"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["agent_id"] == "AGT-L001"
        assert data["command"] == "shell"
        assert data["status"] == "completed"
        print(f"✓ Shell on AGT-L001: {data['result']['output'][:50]}...")
    
    def test_execute_gps_on_android(self):
        """POST /api/c2/agent/AGT-A001/task with {agent_id: 'AGT-A001', command: 'gps'} - executes command on android"""
        response = requests.post(f"{BASE_URL}/api/c2/agent/AGT-A001/task", json={
            "agent_id": "AGT-A001",
            "command": "gps"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["agent_id"] == "AGT-A001"
        assert data["command"] == "gps"
        assert data["status"] == "completed"
        assert "lat" in data["result"] or "GPS Location" in data["result"]["output"]
        print(f"✓ GPS on AGT-A001: {data['result']['output'][:50]}...")
    
    def test_execute_invalid_command_on_windows(self):
        """POST /api/c2/agent/AGT-W001/task with invalid command returns error"""
        response = requests.post(f"{BASE_URL}/api/c2/agent/AGT-W001/task", json={
            "agent_id": "AGT-W001",
            "command": "invalid_command_xyz"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == False
        assert "error" in data
        assert "not available" in data["error"]
        print(f"✓ Invalid command properly rejected: {data['error']}")
    
    def test_task_on_nonexistent_agent(self):
        """POST /api/c2/agent/INVALID/task - returns 404"""
        response = requests.post(f"{BASE_URL}/api/c2/agent/INVALID/task", json={
            "agent_id": "INVALID",
            "command": "screenshot"
        })
        assert response.status_code == 404


class TestC2Payloads:
    """C2 Payload endpoints tests"""
    
    def test_get_all_payloads(self):
        """GET /api/c2/payloads - returns all payloads grouped by platform"""
        response = requests.get(f"{BASE_URL}/api/c2/payloads")
        assert response.status_code == 200
        data = response.json()
        
        assert "all_payloads" in data
        assert data["total"] == 16
        assert "windows" in data["all_payloads"]
        assert "linux" in data["all_payloads"]
        assert "android" in data["all_payloads"]
        assert "ios" in data["all_payloads"]
        print(f"✓ All payloads: {data['total']} total across {len(data['platforms'])} platforms")
    
    def test_get_windows_payloads(self):
        """GET /api/c2/payloads?platform=windows - returns windows payloads"""
        response = requests.get(f"{BASE_URL}/api/c2/payloads?platform=windows")
        assert response.status_code == 200
        data = response.json()
        
        assert data["platform"] == "windows"
        assert len(data["payloads"]) > 0
        # Verify payload structure
        payload = data["payloads"][0]
        assert "name" in payload
        assert "type" in payload
        assert "size" in payload
        assert "evasion" in payload
        print(f"✓ Windows payloads: {data['count']} payloads")


class TestC2Build:
    """C2 Payload build tests"""
    
    def test_build_android_rat(self):
        """POST /api/c2/build with {platform: 'android', payload_type: 'rat'} - builds payload"""
        response = requests.post(f"{BASE_URL}/api/c2/build", json={
            "platform": "android",
            "payload_type": "rat"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["platform"] == "android"
        assert data["status"] == "compiled"
        assert "build_id" in data
        assert "output_file" in data
        assert ".apk" in data["output_file"]
        assert "file_hash" in data
        print(f"✓ Built Android RAT: {data['output_file']}")
    
    def test_build_windows_ransomware(self):
        """POST /api/c2/build with {platform: 'windows', payload_type: 'ransomware'} - builds payload"""
        response = requests.post(f"{BASE_URL}/api/c2/build", json={
            "platform": "windows",
            "payload_type": "ransomware"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["platform"] == "windows"
        assert data["status"] == "compiled"
        assert ".exe" in data["output_file"]
        print(f"✓ Built Windows Ransomware: {data['output_file']}")
    
    def test_build_invalid_platform(self):
        """POST /api/c2/build with invalid platform returns 400"""
        response = requests.post(f"{BASE_URL}/api/c2/build", json={
            "platform": "macos",
            "payload_type": "rat"
        })
        assert response.status_code == 400


class TestC2Labs:
    """C2 Lab environments tests"""
    
    def test_get_lab_environments(self):
        """GET /api/c2/lab/environments - returns 4 lab environments"""
        response = requests.get(f"{BASE_URL}/api/c2/lab/environments")
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_labs"] == 4
        assert len(data["labs"]) == 4
        
        # Verify lab structure
        lab = data["labs"][0]
        assert "name" in lab
        assert "targets" in lab
        assert "network" in lab
        assert "agents" in lab
        assert "scenario" in lab
        assert "difficulty" in lab
        
        # Verify difficulty levels
        difficulties = [l["difficulty"] for l in data["labs"]]
        assert "EASY" in difficulties
        assert "MEDIUM" in difficulties
        assert "HARD" in difficulties
        assert "EXPERT" in difficulties
        print(f"✓ Lab environments: {data['total_labs']} labs with {data['total_agents']} total agents")


class TestC2Audit:
    """C2 Audit log tests"""
    
    def test_get_audit_log(self):
        """GET /api/c2/audit - returns audit log entries"""
        response = requests.get(f"{BASE_URL}/api/c2/audit")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_entries" in data
        assert "entries" in data
        assert "timestamp" in data
        print(f"✓ Audit log: {data['total_entries']} entries")
    
    def test_add_audit_entry(self):
        """POST /api/c2/audit/log with {action: 'test', target: 'test-agent'} - adds audit entry"""
        response = requests.post(f"{BASE_URL}/api/c2/audit/log", json={
            "action": "test_action",
            "target": "test-agent"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["action"] == "test_action"
        assert data["agent"] == "test-agent"
        assert data["result"] == "logged"
        assert "id" in data
        assert "timestamp" in data
        print(f"✓ Added audit entry: {data['action']} -> {data['agent']}")


class TestC2Commands:
    """C2 Platform commands tests"""
    
    def test_get_windows_commands(self):
        """GET /api/c2/commands/windows - returns available windows commands"""
        response = requests.get(f"{BASE_URL}/api/c2/commands/windows")
        assert response.status_code == 200
        data = response.json()
        
        assert data["platform"] == "windows"
        assert data["total"] > 0
        command_names = [c["command"] for c in data["commands"]]
        assert "screenshot" in command_names
        assert "mimikatz" in command_names
        assert "hashdump" in command_names
        print(f"✓ Windows commands: {data['total']} commands available")
    
    def test_get_android_commands(self):
        """GET /api/c2/commands/android - returns available android commands"""
        response = requests.get(f"{BASE_URL}/api/c2/commands/android")
        assert response.status_code == 200
        data = response.json()
        
        assert data["platform"] == "android"
        assert data["total"] > 0
        command_names = [c["command"] for c in data["commands"]]
        assert "gps" in command_names
        assert "sms_dump" in command_names
        assert "camera" in command_names
        print(f"✓ Android commands: {data['total']} commands available")
    
    def test_get_linux_commands(self):
        """GET /api/c2/commands/linux - returns available linux commands"""
        response = requests.get(f"{BASE_URL}/api/c2/commands/linux")
        assert response.status_code == 200
        data = response.json()
        
        assert data["platform"] == "linux"
        assert data["total"] > 0
        command_names = [c["command"] for c in data["commands"]]
        assert "shell" in command_names
        print(f"✓ Linux commands: {data['total']} commands available")
    
    def test_get_ios_commands(self):
        """GET /api/c2/commands/ios - returns available ios commands"""
        response = requests.get(f"{BASE_URL}/api/c2/commands/ios")
        assert response.status_code == 200
        data = response.json()
        
        assert data["platform"] == "ios"
        assert data["total"] > 0
        command_names = [c["command"] for c in data["commands"]]
        assert "icloud_dump" in command_names
        print(f"✓ iOS commands: {data['total']} commands available")
    
    def test_get_invalid_platform_commands(self):
        """GET /api/c2/commands/invalid - returns 404"""
        response = requests.get(f"{BASE_URL}/api/c2/commands/macos")
        assert response.status_code == 404
