# ============================================================================
# Training Academy API Tests - X=pi by Carbi
# Tests for all 12 cybersecurity training programs in the Training Academy
# ============================================================================

import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

# ============================================================================
# Test: List All Programs (/api/academy/programs)
# ============================================================================

class TestAcademyPrograms:
    """Tests for GET /api/academy/programs endpoint"""
    
    def test_list_programs_returns_200(self):
        """Verify endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/academy/programs")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: GET /api/academy/programs returns 200")
    
    def test_list_programs_returns_12_programs(self):
        """Verify exactly 12 programs are returned"""
        response = requests.get(f"{BASE_URL}/api/academy/programs")
        data = response.json()
        assert data["total"] == 12, f"Expected 12 programs, got {data['total']}"
        assert len(data["programs"]) == 12, f"Expected 12 programs in list, got {len(data['programs'])}"
        print(f"PASS: Returns 12 programs (total: {data['total']})")
    
    def test_list_programs_has_required_fields(self):
        """Verify each program has required fields"""
        response = requests.get(f"{BASE_URL}/api/academy/programs")
        programs = response.json()["programs"]
        
        required_fields = ["id", "name", "icon", "color", "tagline", "category", "difficulty", "desc", "levels", "total_xp", "total_challenges"]
        
        for program in programs:
            for field in required_fields:
                assert field in program, f"Missing field '{field}' in program {program.get('id', 'unknown')}"
        print(f"PASS: All 12 programs have required fields: {required_fields}")
    
    def test_list_programs_specific_names(self):
        """Verify all 12 original program names are present"""
        response = requests.get(f"{BASE_URL}/api/academy/programs")
        programs = response.json()["programs"]
        
        expected_names = [
            "ShadowForge", "CyberSprout", "WarGrid", "CipherVault",
            "PhantomGate", "FlagHunter", "BladePentest", "StrikeHawk",
            "WebWraith", "CyberDrill", "BreachPoint", "BlueShield"
        ]
        
        program_names = [p["name"] for p in programs]
        for name in expected_names:
            assert name in program_names, f"Missing program: {name}"
        print(f"PASS: All 12 original programs found: {program_names}")
    
    def test_list_programs_total_xp_and_challenges(self):
        """Verify total_xp and total_challenges are calculated"""
        response = requests.get(f"{BASE_URL}/api/academy/programs")
        data = response.json()
        
        assert "total_xp" in data, "Missing total_xp in response"
        assert "total_challenges" in data, "Missing total_challenges in response"
        assert data["total_xp"] > 0, f"total_xp should be > 0, got {data['total_xp']}"
        assert data["total_challenges"] > 0, f"total_challenges should be > 0, got {data['total_challenges']}"
        print(f"PASS: total_xp={data['total_xp']}, total_challenges={data['total_challenges']}")


# ============================================================================
# Test: Individual Program Details (/api/academy/program/{id})
# ============================================================================

class TestAcademyProgramDetail:
    """Tests for GET /api/academy/program/{id} endpoint"""
    
    def test_shadowforge_returns_3_levels(self):
        """ShadowForge should have 3 levels"""
        response = requests.get(f"{BASE_URL}/api/academy/program/shadowforge")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "ShadowForge"
        assert len(data["levels"]) == 3, f"Expected 3 levels, got {len(data['levels'])}"
        print(f"PASS: ShadowForge has {len(data['levels'])} levels")
    
    def test_cybersprout_returns_3_levels(self):
        """CyberSprout should have 3 levels"""
        response = requests.get(f"{BASE_URL}/api/academy/program/cybersprout")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "CyberSprout"
        assert len(data["levels"]) == 3, f"Expected 3 levels, got {len(data['levels'])}"
        print(f"PASS: CyberSprout has {len(data['levels'])} levels")
    
    def test_wargrid_returns_3_levels(self):
        """WarGrid should have 3 levels"""
        response = requests.get(f"{BASE_URL}/api/academy/program/wargrid")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "WarGrid"
        assert len(data["levels"]) == 3, f"Expected 3 levels, got {len(data['levels'])}"
        print(f"PASS: WarGrid has {len(data['levels'])} levels")
    
    def test_ciphervault_returns_2_levels(self):
        """CipherVault should have 2 levels"""
        response = requests.get(f"{BASE_URL}/api/academy/program/ciphervault")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "CipherVault"
        assert len(data["levels"]) == 2, f"Expected 2 levels, got {len(data['levels'])}"
        print(f"PASS: CipherVault has {len(data['levels'])} levels")
    
    def test_phantomgate_returns_2_levels(self):
        """PhantomGate should have 2 levels"""
        response = requests.get(f"{BASE_URL}/api/academy/program/phantomgate")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "PhantomGate"
        assert len(data["levels"]) == 2, f"Expected 2 levels, got {len(data['levels'])}"
        print(f"PASS: PhantomGate has {len(data['levels'])} levels")
    
    def test_blueshield_returns_2_levels(self):
        """BlueShield should have 2 levels"""
        response = requests.get(f"{BASE_URL}/api/academy/program/blueshield")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "BlueShield"
        assert len(data["levels"]) == 2, f"Expected 2 levels, got {len(data['levels'])}"
        print(f"PASS: BlueShield has {len(data['levels'])} levels")
    
    def test_invalid_program_returns_404(self):
        """Invalid program ID should return 404"""
        response = requests.get(f"{BASE_URL}/api/academy/program/invalid-id")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Invalid program ID returns 404")
    
    def test_program_detail_has_required_fields(self):
        """Program detail should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/academy/program/shadowforge")
        data = response.json()
        
        required_fields = ["id", "name", "icon", "color", "tagline", "category", "difficulty", "desc", "levels", "total_xp", "total_challenges"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        print(f"PASS: Program detail has all required fields")
    
    def test_level_detail_in_program(self):
        """Verify level detail structure"""
        response = requests.get(f"{BASE_URL}/api/academy/program/shadowforge")
        data = response.json()
        
        level = data["levels"][0]
        required_level_fields = ["id", "name", "difficulty", "xp", "briefing", "challenges"]
        for field in required_level_fields:
            assert field in level, f"Missing level field: {field}"
        print(f"PASS: Level has required fields: {required_level_fields}")


# ============================================================================
# Test: Level Details (/api/academy/program/{id}/level/{level_id})
# ============================================================================

class TestAcademyLevelDetail:
    """Tests for GET /api/academy/program/{id}/level/{level_id} endpoint"""
    
    def test_shadowforge_level_sf1_has_3_challenges(self):
        """ShadowForge sf-1 should have 3 challenges"""
        response = requests.get(f"{BASE_URL}/api/academy/program/shadowforge/level/sf-1")
        assert response.status_code == 200
        data = response.json()
        assert len(data["challenges"]) == 3, f"Expected 3 challenges, got {len(data['challenges'])}"
        print(f"PASS: sf-1 has {len(data['challenges'])} challenges")
    
    def test_cybersprout_level_cs1_has_4_challenges(self):
        """CyberSprout cs-1 should have 4 challenges"""
        response = requests.get(f"{BASE_URL}/api/academy/program/cybersprout/level/cs-1")
        assert response.status_code == 200
        data = response.json()
        assert len(data["challenges"]) == 4, f"Expected 4 challenges, got {len(data['challenges'])}"
        print(f"PASS: cs-1 has {len(data['challenges'])} challenges")
    
    def test_level_challenge_structure(self):
        """Verify challenge structure in level"""
        response = requests.get(f"{BASE_URL}/api/academy/program/shadowforge/level/sf-1")
        data = response.json()
        
        challenge = data["challenges"][0]
        required_fields = ["id", "type", "prompt", "points"]
        for field in required_fields:
            assert field in challenge, f"Missing challenge field: {field}"
        print(f"PASS: Challenge has required fields: {required_fields}")
    
    def test_invalid_level_returns_404(self):
        """Invalid level ID should return 404"""
        response = requests.get(f"{BASE_URL}/api/academy/program/shadowforge/level/invalid-level")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Invalid level ID returns 404")
    
    def test_level_has_program_name_and_color(self):
        """Level should include program name and color"""
        response = requests.get(f"{BASE_URL}/api/academy/program/shadowforge/level/sf-1")
        data = response.json()
        
        assert "program" in data, "Missing 'program' field"
        assert "color" in data, "Missing 'color' field"
        assert data["program"] == "ShadowForge"
        print(f"PASS: Level includes program={data['program']}, color={data['color']}")


# ============================================================================
# Test: Answer Submission (/api/academy/submit)
# ============================================================================

class TestAcademySubmit:
    """Tests for POST /api/academy/submit endpoint"""
    
    def test_correct_answer_shadowforge_sf1_1(self):
        """Correct answer for sf-1-1 (260) should return correct:true"""
        response = requests.post(f"{BASE_URL}/api/academy/submit", json={
            "program_id": "shadowforge",
            "level_id": "sf-1",
            "challenge_id": "sf-1-1",
            "user_input": "260"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["correct"] == True, f"Expected correct=True, got {data['correct']}"
        assert data["points"] > 0, f"Expected points > 0, got {data['points']}"
        print(f"PASS: Correct answer '260' returns correct=True, points={data['points']}")
    
    def test_wrong_answer_shadowforge_sf1_1(self):
        """Wrong answer should return correct:false with hint"""
        response = requests.post(f"{BASE_URL}/api/academy/submit", json={
            "program_id": "shadowforge",
            "level_id": "sf-1",
            "challenge_id": "sf-1-1",
            "user_input": "wrong"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["correct"] == False, f"Expected correct=False, got {data['correct']}"
        assert "hint" in data and data["hint"], "Missing hint for wrong answer"
        assert data["points"] == 0, f"Expected points=0 for wrong answer, got {data['points']}"
        print(f"PASS: Wrong answer returns correct=False, hint='{data['hint'][:50]}...'")
    
    def test_correct_answer_cybersprout_cs1_1(self):
        """Correct answer for cs-1-1 (https) should return correct:true"""
        response = requests.post(f"{BASE_URL}/api/academy/submit", json={
            "program_id": "cybersprout",
            "level_id": "cs-1",
            "challenge_id": "cs-1-1",
            "user_input": "https"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["correct"] == True, f"Expected correct=True, got {data['correct']}"
        print(f"PASS: Correct answer 'https' returns correct=True")
    
    def test_correct_answer_wargrid_wg2_2(self):
        """Correct answer for wg-2-2 (pirate) should return correct:true"""
        response = requests.post(f"{BASE_URL}/api/academy/submit", json={
            "program_id": "wargrid",
            "level_id": "wg-2",
            "challenge_id": "wg-2-2",
            "user_input": "pirate"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["correct"] == True, f"Expected correct=True, got {data['correct']}"
        print(f"PASS: Correct answer 'pirate' returns correct=True")
    
    def test_case_insensitive_answer(self):
        """Answers should be case insensitive"""
        response = requests.post(f"{BASE_URL}/api/academy/submit", json={
            "program_id": "cybersprout",
            "level_id": "cs-1",
            "challenge_id": "cs-1-1",
            "user_input": "HTTPS"  # uppercase
        })
        assert response.status_code == 200
        data = response.json()
        assert data["correct"] == True, "Answer should be case insensitive"
        print("PASS: Answer validation is case insensitive")
    
    def test_invalid_program_submit_returns_404(self):
        """Submit to invalid program should return 404"""
        response = requests.post(f"{BASE_URL}/api/academy/submit", json={
            "program_id": "invalid-program",
            "level_id": "sf-1",
            "challenge_id": "sf-1-1",
            "user_input": "260"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Invalid program in submit returns 404")
    
    def test_invalid_level_submit_returns_404(self):
        """Submit to invalid level should return 404"""
        response = requests.post(f"{BASE_URL}/api/academy/submit", json={
            "program_id": "shadowforge",
            "level_id": "invalid-level",
            "challenge_id": "sf-1-1",
            "user_input": "260"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Invalid level in submit returns 404")
    
    def test_invalid_challenge_submit_returns_404(self):
        """Submit to invalid challenge should return 404"""
        response = requests.post(f"{BASE_URL}/api/academy/submit", json={
            "program_id": "shadowforge",
            "level_id": "sf-1",
            "challenge_id": "invalid-challenge",
            "user_input": "260"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Invalid challenge in submit returns 404")
    
    def test_submit_response_has_message(self):
        """Submit response should include a message"""
        response = requests.post(f"{BASE_URL}/api/academy/submit", json={
            "program_id": "shadowforge",
            "level_id": "sf-1",
            "challenge_id": "sf-1-1",
            "user_input": "260"
        })
        data = response.json()
        assert "message" in data and data["message"], "Missing message in response"
        print(f"PASS: Submit response includes message: '{data['message']}'")


# ============================================================================
# Test: All 12 Programs Have Correct Structure
# ============================================================================

class TestAllPrograms:
    """Verify all 12 programs are correctly configured"""
    
    PROGRAM_IDS = [
        "shadowforge", "cybersprout", "wargrid", "ciphervault",
        "phantomgate", "flaghunter", "bladepent", "strikehawk",
        "webwraith", "cyberdrill", "breachpoint", "blueshield"
    ]
    
    @pytest.mark.parametrize("program_id", PROGRAM_IDS)
    def test_program_exists_and_has_levels(self, program_id):
        """Each program should exist and have at least 1 level"""
        response = requests.get(f"{BASE_URL}/api/academy/program/{program_id}")
        assert response.status_code == 200, f"Program {program_id} not found"
        data = response.json()
        assert len(data["levels"]) >= 1, f"Program {program_id} has no levels"
        print(f"PASS: {program_id} has {len(data['levels'])} level(s)")
    
    @pytest.mark.parametrize("program_id", PROGRAM_IDS)
    def test_program_has_xp_and_challenges(self, program_id):
        """Each program should have XP and challenges"""
        response = requests.get(f"{BASE_URL}/api/academy/program/{program_id}")
        data = response.json()
        assert data["total_xp"] > 0, f"Program {program_id} has no XP"
        assert data["total_challenges"] > 0, f"Program {program_id} has no challenges"
        print(f"PASS: {program_id} has {data['total_xp']} XP, {data['total_challenges']} challenges")


# ============================================================================
# Test: AI Mentor Endpoint (if accessible)
# ============================================================================

class TestAIMentor:
    """Tests for POST /api/academy/ai-mentor endpoint"""
    
    def test_ai_mentor_returns_response(self):
        """AI Mentor should return a mentor response"""
        response = requests.post(f"{BASE_URL}/api/academy/ai-mentor", json={
            "program_id": "shadowforge",
            "level_id": "sf-1",
            "challenge_id": "sf-1-1",
            "question": "What is a buffer overflow?"
        })
        assert response.status_code == 200
        data = response.json()
        assert "mentor_response" in data, "Missing mentor_response"
        assert "program" in data, "Missing program in response"
        assert "level" in data, "Missing level in response"
        print(f"PASS: AI Mentor returns response with mentor_response")
    
    def test_ai_mentor_invalid_program_returns_404(self):
        """AI Mentor with invalid program should return 404"""
        response = requests.post(f"{BASE_URL}/api/academy/ai-mentor", json={
            "program_id": "invalid-program",
            "level_id": "sf-1",
            "challenge_id": "sf-1-1",
            "question": "Help me"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: AI Mentor with invalid program returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
